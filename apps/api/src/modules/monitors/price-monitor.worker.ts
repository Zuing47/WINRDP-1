import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertType } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';
import { QUEUES, QueueService } from '../../infra/queue.service';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * Worker price-monitor: compara o price_history recente de cada modelo
 * monitorado e gera alerts (PRICE_RISE, PRICE_DROP, OPPORTUNITY,
 * BIG_DISCOUNT) + notifications.
 */
@Injectable()
export class PriceMonitorWorker {
  private readonly logger = new Logger(PriceMonitorWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly notifications: NotificationsService,
  ) {
    this.queue.registerHandler(QUEUES.PRICE_MONITOR, async () => {
      await this.runAll();
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async schedule(): Promise<void> {
    await this.queue.add(QUEUES.PRICE_MONITOR, { triggeredAt: new Date().toISOString() });
  }

  async runAll(): Promise<{ checked: number; alertsCreated: number }> {
    const monitors = await this.prisma.monitor.findMany({
      where: { active: true },
      include: { model: { include: { brand: true } } },
    });

    let alertsCreated = 0;
    for (const monitor of monitors) {
      try {
        alertsCreated += await this.check(monitor);
      } catch (err) {
        this.logger.warn(`Monitor ${monitor.id} falhou: ${(err as Error).message}`);
      }
    }
    this.logger.log(`price-monitor: ${monitors.length} monitores, ${alertsCreated} alertas.`);
    return { checked: monitors.length, alertsCreated };
  }

  private async check(monitor: {
    id: string;
    userId: string;
    modelId: string;
    targetPrice: number | null;
    notifyOnRise: boolean;
    notifyOnDrop: boolean;
    notifyOnOpportunity: boolean;
    notifyOnBigDiscount: boolean;
    model: { name: string; brand: { name: string } };
  }): Promise<number> {
    const history = await this.prisma.priceHistory.findMany({
      where: { modelId: monitor.modelId },
      orderBy: { date: 'desc' },
      take: 8,
    });
    await this.prisma.monitor.update({
      where: { id: monitor.id },
      data: { lastCheckedAt: new Date() },
    });
    if (history.length < 2) return 0;

    const latest = history[0];
    const previous = history[history.length - 1]; // ~1 semana atrás
    const change = previous.medianPrice > 0 ? latest.medianPrice / previous.medianPrice - 1 : 0;
    const productName = `${monitor.model.brand.name} ${monitor.model.name}`;

    let created = 0;
    const emit = async (type: AlertType, title: string, body: string): Promise<void> => {
      // evita duplicar alerta do mesmo tipo no mesmo dia
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const exists = await this.prisma.alert.findFirst({
        where: { monitorId: monitor.id, type, createdAt: { gte: today } },
      });
      if (exists) return;
      await this.prisma.alert.create({
        data: {
          monitorId: monitor.id,
          type,
          oldPrice: previous.medianPrice,
          newPrice: latest.medianPrice,
          listingUrl: null,
        },
      });
      await this.notifications.create(monitor.userId, 'ALERT', title, body, {
        monitorId: monitor.id,
        type,
      });
      created += 1;
    };

    if (monitor.notifyOnRise && change >= 0.05) {
      await emit(
        'PRICE_RISE',
        `Preço em alta: ${productName}`,
        `A mediana subiu ${(change * 100).toFixed(1)}% na última semana (R$ ${previous.medianPrice.toFixed(0)} → R$ ${latest.medianPrice.toFixed(0)}). Bom momento para vender.`,
      );
    }
    if (monitor.notifyOnDrop && change <= -0.05) {
      await emit(
        'PRICE_DROP',
        `Preço em queda: ${productName}`,
        `A mediana caiu ${(Math.abs(change) * 100).toFixed(1)}% na última semana (R$ ${previous.medianPrice.toFixed(0)} → R$ ${latest.medianPrice.toFixed(0)}).`,
      );
    }
    if (
      monitor.notifyOnOpportunity &&
      monitor.targetPrice !== null &&
      latest.minPrice <= monitor.targetPrice
    ) {
      await emit(
        'OPPORTUNITY',
        `Oportunidade: ${productName}`,
        `Encontramos anúncios a partir de R$ ${latest.minPrice.toFixed(0)}, abaixo do seu preço-alvo de R$ ${monitor.targetPrice.toFixed(0)}.`,
      );
    }
    if (monitor.notifyOnBigDiscount && latest.medianPrice > 0 && latest.minPrice <= latest.medianPrice * 0.75) {
      await emit(
        'BIG_DISCOUNT',
        `Grande desconto: ${productName}`,
        `Há anúncio ${(100 - (latest.minPrice / latest.medianPrice) * 100).toFixed(0)}% abaixo da mediana de mercado (R$ ${latest.minPrice.toFixed(0)} vs R$ ${latest.medianPrice.toFixed(0)}). Verifique se não é golpe.`,
      );
    }
    return created;
  }
}
