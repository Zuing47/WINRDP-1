import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginationDto, paginated } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, dto: PaginationDto, unreadOnly = false) {
    const where = { monitor: { userId }, ...(unreadOnly ? { read: false } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.alert.findMany({
        where,
        include: { monitor: { include: { model: { include: { brand: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: dto.skip,
        take: dto.perPage,
      }),
      this.prisma.alert.count({ where }),
    ]);
    return paginated(items, total, dto);
  }

  async markRead(userId: string, id: string) {
    const alert = await this.prisma.alert.findFirst({
      where: { id, monitor: { userId } },
    });
    if (!alert) throw new NotFoundException('Alerta não encontrado');
    return this.prisma.alert.update({ where: { id }, data: { read: true } });
  }
}
