import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      totalEvaluations,
      totalRevenueCents,
      usersThisMonth,
      usersLastMonth,
      evaluationsThisMonth,
      evaluationsLastMonth,
      byCategory,
      activeSubscriptions,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.evaluation.count({ where: { status: { not: 'DRAFT' } } }),
      this.prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: { select: { priceCents: true } } },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
      this.prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
      this.prisma.evaluation.count({ where: { createdAt: { gte: thisMonthStart }, status: { not: 'DRAFT' } } }),
      this.prisma.evaluation.count({
        where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart }, status: { not: 'DRAFT' } },
      }),
      this.prisma.evaluation.groupBy({
        by: ['modelId'],
        where: { status: { not: 'DRAFT' } },
        orderBy: { modelId: 'asc' },
        _count: { _all: true },
      }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    const revenueCents = totalRevenueCents.reduce((acc, s) => acc + s.plan.priceCents, 0);
    const growth = (curr: number, prev: number): number =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 10000) / 100;

    // agrupar por categoria (via modelo)
    const models = await this.prisma.model.findMany({
      where: { id: { in: byCategory.map((b) => b.modelId) } },
      select: { id: true, category: { select: { name: true } } },
    });
    const categoryCounts = new Map<string, number>();
    for (const group of byCategory) {
      const model = models.find((m) => m.id === group.modelId);
      const name = model?.category.name ?? 'Outros';
      const count = typeof group._count === 'object' ? (group._count?._all ?? 0) : 0;
      categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + count);
    }

    return {
      totalUsers,
      totalEvaluations,
      activeSubscriptions,
      monthlyRecurringRevenue: revenueCents / 100,
      growth: {
        users: growth(usersThisMonth, usersLastMonth),
        evaluations: growth(evaluationsThisMonth, evaluationsLastMonth),
      },
      evaluationsByCategory: [...categoryCounts.entries()].map(([category, count]) => ({
        category,
        count,
      })),
    };
  }
}
