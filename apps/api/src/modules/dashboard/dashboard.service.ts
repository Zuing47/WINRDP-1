import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(userId: string) {
    const [evaluationsCount, productsCount, doneEvaluations, activeMonitors, unreadAlerts] =
      await this.prisma.$transaction([
        this.prisma.evaluation.count({ where: { userId, status: { not: 'DRAFT' } } }),
        this.prisma.evaluation.findMany({
          where: { userId, status: { not: 'DRAFT' } },
          distinct: ['modelId'],
          select: { modelId: true },
        }),
        this.prisma.evaluation.findMany({
          where: { userId, status: 'DONE' },
          select: { maxPrice: true, recommendedPrice: true },
        }),
        this.prisma.monitor.count({ where: { userId, active: true } }),
        this.prisma.alert.count({ where: { monitor: { userId }, read: false } }),
      ]);

    // economia gerada = Σ(max − recommended) das avaliações concluídas
    const savings = doneEvaluations.reduce(
      (acc, e) => acc + Math.max(0, (e.maxPrice ?? 0) - (e.recommendedPrice ?? 0)),
      0,
    );

    return {
      evaluationsCount,
      productsEvaluated: productsCount.length,
      savingsGenerated: Math.round(savings * 100) / 100,
      activeMonitors,
      unreadAlerts,
    };
  }

  /** Série de avaliações por dia — últimos 30 dias. */
  async activity(userId: string) {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const evaluations = await this.prisma.evaluation.findMany({
      where: { userId, createdAt: { gte: since }, status: { not: 'DRAFT' } },
      select: { createdAt: true },
    });

    const byDay = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      byDay.set(d.toISOString().slice(0, 10), 0);
    }
    for (const e of evaluations) {
      const key = e.createdAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    return [...byDay.entries()].map(([date, count]) => ({ date, count }));
  }
}
