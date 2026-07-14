import { Injectable } from '@nestjs/common';
import { PaginationDto, paginated } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class AdminSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(dto: PaginationDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        include: { plan: true, user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: dto.skip,
        take: dto.perPage,
      }),
      this.prisma.subscription.count(),
    ]);
    return paginated(items, total, dto);
  }
}
