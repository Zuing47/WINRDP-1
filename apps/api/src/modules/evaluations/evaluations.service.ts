import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginated } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../infra/prisma.service';
import { S3Service } from '../../infra/s3.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ListEvaluationsDto, PresignPhotosDto } from './dto/evaluation.dto';

const MAX_PHOTOS = 15;

@Injectable()
export class EvaluationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async presignPhotos(userId: string, evaluationId: string, dto: PresignPhotosDto) {
    const evaluation = await this.prisma.evaluation.findFirst({
      where: { id: evaluationId, userId },
      include: { _count: { select: { photos: true } } },
    });
    if (!evaluation) throw new NotFoundException('Avaliação não encontrada');

    const limits = await this.subscriptions.getLimits(userId);
    const maxAllowed = Math.min(MAX_PHOTOS, limits.photosPerEvaluation);
    if (evaluation._count.photos + dto.photos.length > maxAllowed) {
      throw new BadRequestException(
        `Máximo de ${maxAllowed} fotos por avaliação no seu plano (${evaluation._count.photos} já enviadas).`,
      );
    }

    const uploads = [];
    for (let i = 0; i < dto.photos.length; i++) {
      const presigned = await this.s3.presignUpload(
        `evaluations/${evaluationId}`,
        dto.photos[i].contentType,
      );
      const photo = await this.prisma.photo.create({
        data: {
          evaluationId,
          storageKey: presigned.storageKey,
          url: presigned.publicUrl,
          order: evaluation._count.photos + i,
        },
      });
      uploads.push({
        photoId: photo.id,
        storageKey: presigned.storageKey,
        uploadUrl: presigned.uploadUrl,
        publicUrl: presigned.publicUrl,
        expiresIn: presigned.expiresIn,
      });
    }
    return { uploads, s3Configured: this.s3.isConfigured };
  }

  async findById(userId: string, id: string, isAdmin = false) {
    const evaluation = await this.prisma.evaluation.findFirst({
      where: isAdmin ? { id } : { id, userId },
      include: {
        model: { include: { brand: true, category: true } },
        photos: { orderBy: { order: 'asc' } },
        conditionReport: true,
        marketPrices: { orderBy: { price: 'asc' } },
      },
    });
    if (!evaluation) throw new NotFoundException('Avaliação não encontrada');

    const valid = evaluation.marketPrices.filter((m) => !m.excludedReason);
    const excluded = evaluation.marketPrices.filter((m) => m.excludedReason);
    return {
      ...evaluation,
      marketPrices: valid,
      excludedListings: excluded,
      marketStats: {
        sampleSize: valid.length,
        excludedCount: excluded.length,
        min: evaluation.minMarketPrice,
        avg: evaluation.avgMarketPrice,
        median: evaluation.medianMarketPrice,
      },
    };
  }

  async list(userId: string, dto: ListEvaluationsDto) {
    const where: Prisma.EvaluationWhereInput = { userId };
    if (dto.status) where.status = dto.status;
    if (dto.modelId) where.modelId = dto.modelId;
    if (dto.search) {
      where.model = { name: { contains: dto.search, mode: 'insensitive' } };
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.evaluation.findMany({
        where,
        include: { model: { include: { brand: true, category: true } } },
        orderBy: { createdAt: 'desc' },
        skip: dto.skip,
        take: dto.perPage,
      }),
      this.prisma.evaluation.count({ where }),
    ]);
    return paginated(items, total, dto);
  }

  async breakdown(userId: string, id: string) {
    const evaluation = await this.prisma.evaluation.findFirst({ where: { id, userId } });
    if (!evaluation) throw new NotFoundException('Avaliação não encontrada');
    const adjustments = await this.prisma.priceAdjustment.findMany({
      where: { evaluationId: id },
      orderBy: { order: 'asc' },
    });
    return {
      evaluationId: id,
      status: evaluation.status,
      recommendedPrice: evaluation.recommendedPrice,
      adjustments,
    };
  }
}
