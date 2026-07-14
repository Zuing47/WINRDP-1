import {
  ConflictException,
  Injectable,
  Logger,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../infra/prisma.service';
import { GoogleAuthDto, LoginDto, RegisterDto } from './dto/auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sanitize(user: User) {
    const { passwordHash: _p, ...rest } = user;
    return rest;
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.accessTtl') ?? '15m',
      },
    );
    const refreshToken = randomBytes(48).toString('hex');
    const days = this.config.get<number>('jwt.refreshTtlDays') ?? 30;
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + days * 24 * 3600 * 1000),
      },
    });
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (exists) throw new ConflictException('E-mail já cadastrado');
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash: await bcrypt.hash(dto.password, 10),
      },
    });
    const tokens = await this.issueTokens(user);
    return { user: this.sanitize(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('Conta suspensa');
    const tokens = await this.issueTokens(user);
    return { user: this.sanitize(user), ...tokens };
  }

  /**
   * Rotação de refresh token com detecção de reuso: token já rotacionado
   * sendo reapresentado ⇒ possível roubo ⇒ revoga TODOS os tokens do usuário.
   */
  async refresh(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored) throw new UnauthorizedException('Refresh token inválido');

    if (stored.revokedAt || stored.replacedBy) {
      this.logger.warn(`Reuso de refresh token detectado (user ${stored.userId}) — revogando sessões.`);
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Reuso de refresh token detectado — sessões revogadas');
    }
    if (stored.expiresAt < new Date()) throw new UnauthorizedException('Refresh token expirado');

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Usuário inválido');

    const tokens = await this.issueTokens(user);
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedBy: this.hashToken(tokens.refreshToken) },
    });
    return { user: this.sanitize(user), ...tokens };
  }

  async logout(rawToken: string | undefined, userId: string) {
    if (rawToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: this.hashToken(rawToken), userId },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  /**
   * Google OAuth — valida o id_token via endpoint tokeninfo do Google.
   * Sem GOOGLE_CLIENT_ID configurado responde 501 com mensagem clara.
   */
  async googleAuth(dto: GoogleAuthDto) {
    const clientId = this.config.get<string>('google.clientId');
    if (!clientId) {
      throw new NotImplementedException(
        'Login com Google não configurado neste ambiente. Defina GOOGLE_CLIENT_ID no .env para habilitar.',
      );
    }
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(dto.idToken)}`,
    );
    if (!res.ok) throw new UnauthorizedException('id_token do Google inválido');
    const payload = (await res.json()) as {
      aud?: string;
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
    };
    if (payload.aud !== clientId || !payload.sub || !payload.email) {
      throw new UnauthorizedException('id_token do Google inválido para esta aplicação');
    }

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }] },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: payload.name ?? payload.email.split('@')[0],
          email: payload.email.toLowerCase(),
          googleId: payload.sub,
          avatarUrl: payload.picture,
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub, avatarUrl: user.avatarUrl ?? payload.picture },
      });
    }
    const tokens = await this.issueTokens(user);
    return { user: this.sanitize(user), ...tokens };
  }
}
