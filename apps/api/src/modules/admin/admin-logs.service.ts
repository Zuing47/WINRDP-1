import { Injectable } from '@nestjs/common';
import { PaginationDto, paginated } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class AdminLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(dto: PaginationDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.apiUsageLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: dto.skip,
        take: dto.perPage,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.apiUsageLog.count(),
    ]);
    return paginated(items, total, dto);
  }
}
