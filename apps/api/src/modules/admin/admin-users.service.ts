import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginated } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../infra/prisma.service';
import { ListUsersDto, UpdateUserDto } from './dto/admin-users.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(dto: ListUsersDto) {
    const where: Prisma.UserWhereInput = {};
    if (dto.role) where.role = dto.role;
    if (dto.status) where.status = dto.status;
    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: dto.skip,
        take: dto.perPage,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          _count: { select: { evaluations: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginated(items, total, dto);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const { passwordHash: _p, ...rest } = await this.prisma.user.update({ where: { id }, data: dto });
    return rest;
  }
}
