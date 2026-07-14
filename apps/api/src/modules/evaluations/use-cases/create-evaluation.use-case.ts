import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { CreateEvaluationDto } from '../dto/evaluation.dto';

@Injectable()
export class CreateEvaluationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async execute(userId: string, dto: CreateEvaluationDto) {
    await this.subscriptions.assertCanCreateEvaluation(userId);

    const model = await this.prisma.model.findUnique({
      where: { id: dto.modelId },
      include: { brand: true, category: true },
    });
    if (!model) throw new NotFoundException('Modelo não encontrado no catálogo');

    return this.prisma.evaluation.create({
      data: {
        userId,
        modelId: dto.modelId,
        status: 'DRAFT',
        condition: dto.condition,
        year: dto.year,
        attributes: (dto.attributes ?? {}) as any,
        hasInvoice: dto.hasInvoice ?? false,
        hasWarranty: dto.hasWarranty ?? false,
        accessories: (dto.accessories ?? []) as any,
        locationCity: dto.locationCity,
        locationState: dto.locationState?.toUpperCase(),
      },
      include: { model: { include: { brand: true, category: true } } },
    });
  }
}
