import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../infra/prisma.service';

export interface PlanLimits {
  evaluationsPerMonth: number;
  monitors: number;
  photosPerEvaluation: number;
}

const FREE_LIMITS: PlanLimits = { evaluationsPerMonth: 3, monitors: 1, photosPerEvaluation: 5 };

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  plans() {
    return this.prisma.plan.findMany({ orderBy: { priceCents: 'asc' } });
  }

  async current(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    if (sub) return sub;
    const freePlan = await this.prisma.plan.findUnique({ where: { slug: 'free' } });
    return { plan: freePlan, status: 'ACTIVE', virtual: true };
  }

  /** Mock de gateway de pagamento: ativa a assinatura imediatamente. */
  async subscribe(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plano não encontrado');
    if (plan.slug === 'free') throw new BadRequestException('O plano Free não requer assinatura');

    await this.prisma.subscription.updateMany({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
      data: { status: 'CANCELED' },
    });

    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    return this.prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: end,
        externalId: `mock_${randomUUID()}`,
      },
      include: { plan: true },
    });
  }

  async getLimits(userId: string): Promise<PlanLimits> {
    const sub = await this.current(userId);
    const limits = (sub?.plan?.limits ?? {}) as Partial<PlanLimits>;
    return {
      evaluationsPerMonth: limits.evaluationsPerMonth ?? FREE_LIMITS.evaluationsPerMonth,
      monitors: limits.monitors ?? FREE_LIMITS.monitors,
      photosPerEvaluation: limits.photosPerEvaluation ?? FREE_LIMITS.photosPerEvaluation,
    };
  }

  /** Enforcement: lança 403 se o plano não permite mais avaliações no mês. */
  async assertCanCreateEvaluation(userId: string): Promise<void> {
    const limits = await this.getLimits(userId);
    if (limits.evaluationsPerMonth < 0) return; // ilimitado
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const used = await this.prisma.evaluation.count({
      where: { userId, createdAt: { gte: monthStart }, status: { not: 'DRAFT' } },
    });
    if (used >= limits.evaluationsPerMonth) {
      throw new ForbiddenException(
        `Limite de ${limits.evaluationsPerMonth} avaliações/mês do seu plano atingido. Faça upgrade para continuar.`,
      );
    }
  }

  async assertCanCreateMonitor(userId: string): Promise<void> {
    const limits = await this.getLimits(userId);
    if (limits.monitors < 0) return;
    const used = await this.prisma.monitor.count({ where: { userId, active: true } });
    if (used >= limits.monitors) {
      throw new ForbiddenException(
        `Limite de ${limits.monitors} monitores ativos do seu plano atingido. Faça upgrade para continuar.`,
      );
    }
  }
}
