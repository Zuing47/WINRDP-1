import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  categories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  brands(categoryId?: string) {
    return this.prisma.brand.findMany({
      where: categoryId ? { brandCategories: { some: { categoryId } } } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  models(params: { brandId?: string; categoryId?: string; search?: string }) {
    const where: Prisma.ModelWhereInput = {};
    if (params.brandId) where.brandId = params.brandId;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.search) where.name = { contains: params.search, mode: 'insensitive' };
    return this.prisma.model.findMany({
      where,
      include: { brand: { select: { id: true, name: true, slug: true } } },
      orderBy: { name: 'asc' },
      take: 100,
    });
  }

  async priceHistory(modelId: string, days: number) {
    const model = await this.prisma.model.findUnique({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Modelo não encontrado');
    const since = new Date();
    since.setDate(since.getDate() - Math.min(Math.max(days || 90, 1), 365));
    const history = await this.prisma.priceHistory.findMany({
      where: { modelId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });
    return { model: { id: model.id, name: model.name }, history };
  }
}
