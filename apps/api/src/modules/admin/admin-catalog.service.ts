import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma.service';
import { UpsertBrandDto, UpsertCategoryDto, UpsertModelDto } from './dto/admin-catalog.dto';

@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Categorias ──────────────────────────────────────────────────
  categories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  createCategory(dto: UpsertCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        icon: dto.icon,
        attributesSchema: (dto.attributesSchema ?? []) as any,
        defaultAnnualDepreciation: dto.defaultAnnualDepreciation ?? 0.15,
      },
    });
  }

  async updateCategory(id: string, dto: Partial<UpsertCategoryDto>) {
    await this.assertExists(this.prisma.category, id, 'Categoria');
    return this.prisma.category.update({ where: { id }, data: dto as any });
  }

  async deleteCategory(id: string) {
    await this.assertExists(this.prisma.category, id, 'Categoria');
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }

  // ── Marcas ───────────────────────────────────────────────────────
  brands() {
    return this.prisma.brand.findMany({ orderBy: { name: 'asc' } });
  }

  createBrand(dto: UpsertBrandDto) {
    return this.prisma.brand.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        logoUrl: dto.logoUrl,
        brandCategories: dto.categoryIds
          ? { create: dto.categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
    });
  }

  async updateBrand(id: string, dto: Partial<UpsertBrandDto>) {
    await this.assertExists(this.prisma.brand, id, 'Marca');
    const { categoryIds, ...rest } = dto;
    return this.prisma.brand.update({ where: { id }, data: rest });
  }

  async deleteBrand(id: string) {
    await this.assertExists(this.prisma.brand, id, 'Marca');
    await this.prisma.brand.delete({ where: { id } });
    return { success: true };
  }

  // ── Modelos ──────────────────────────────────────────────────────
  models() {
    return this.prisma.model.findMany({
      include: { brand: true, category: true },
      orderBy: { name: 'asc' },
    });
  }

  createModel(dto: UpsertModelDto) {
    return this.prisma.model.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        releaseYear: dto.releaseYear,
        msrp: dto.msrp,
        specs: (dto.specs ?? {}) as any,
      },
    });
  }

  async updateModel(id: string, dto: Partial<UpsertModelDto>) {
    await this.assertExists(this.prisma.model, id, 'Modelo');
    return this.prisma.model.update({ where: { id }, data: dto as any });
  }

  async deleteModel(id: string) {
    await this.assertExists(this.prisma.model, id, 'Modelo');
    await this.prisma.model.delete({ where: { id } });
    return { success: true };
  }

  private async assertExists(
    delegate: { findUnique: (args: any) => Promise<any> },
    id: string,
    label: string,
  ): Promise<void> {
    const found = await delegate.findUnique({ where: { id } });
    if (!found) throw new NotFoundException(`${label} não encontrada`);
  }
}
