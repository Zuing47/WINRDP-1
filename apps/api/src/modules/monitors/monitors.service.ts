import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateMonitorDto, UpdateMonitorDto } from './dto/monitor.dto';

@Injectable()
export class MonitorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async create(userId: string, dto: CreateMonitorDto) {
    await this.subscriptions.assertCanCreateMonitor(userId);
    const model = await this.prisma.model.findUnique({ where: { id: dto.modelId } });
    if (!model) throw new NotFoundException('Modelo não encontrado');
    return this.prisma.monitor.create({
      data: {
        userId,
        modelId: dto.modelId,
        condition: dto.condition ?? 'GOOD',
        targetPrice: dto.targetPrice,
        notifyOnRise: dto.notifyOnRise ?? true,
        notifyOnDrop: dto.notifyOnDrop ?? true,
        notifyOnOpportunity: dto.notifyOnOpportunity ?? true,
        notifyOnBigDiscount: dto.notifyOnBigDiscount ?? true,
      },
      include: { model: { include: { brand: true } } },
    });
  }

  list(userId: string) {
    return this.prisma.monitor.findMany({
      where: { userId },
      include: {
        model: { include: { brand: true, category: true } },
        _count: { select: { alerts: { where: { read: false } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async ownedMonitor(userId: string, id: string) {
    const monitor = await this.prisma.monitor.findFirst({ where: { id, userId } });
    if (!monitor) throw new NotFoundException('Monitor não encontrado');
    return monitor;
  }

  async update(userId: string, id: string, dto: UpdateMonitorDto) {
    await this.ownedMonitor(userId, id);
    return this.prisma.monitor.update({
      where: { id },
      data: dto,
      include: { model: { include: { brand: true } } },
    });
  }

  async remove(userId: string, id: string) {
    await this.ownedMonitor(userId, id);
    await this.prisma.monitor.delete({ where: { id } });
    return { success: true };
  }
}
