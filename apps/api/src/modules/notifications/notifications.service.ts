import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PaginationDto, paginated } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, dto: PaginationDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: dto.skip,
        take: dto.perPage,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return paginated(items, total, dto);
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notificação não encontrada');
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  /** Usado por workers (avaliação concluída, alertas, etc.). */
  create(userId: string, type: NotificationType, title: string, body: string, data: object = {}) {
    return this.prisma.notification.create({
      data: { userId, type, title, body, data: data as any },
    });
  }
}
