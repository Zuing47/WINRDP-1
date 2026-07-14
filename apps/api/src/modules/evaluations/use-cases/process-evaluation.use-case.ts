import { Injectable, Logger } from '@nestjs/common';
import { EvaluationStatus } from '@prisma/client';
import { seededRng } from '../../../common/utils/random';
import { PrismaService } from '../../../infra/prisma.service';
import { AiService } from '../../ai/ai.service';
import { MarketSearchService } from '../../market/market-search.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { PricingEngine } from '../../pricing/engine/pricing-engine';
import { PricingContext } from '../../pricing/stages/pricing-stage.interface';

/**
 * Worker do pipeline de avaliação:
 * PENDING → ANALYZING_PHOTOS → SEARCHING_MARKET → PRICING → DONE|FAILED
 */
@Injectable()
export class ProcessEvaluationUseCase {
  private readonly logger = new Logger(ProcessEvaluationUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly market: MarketSearchService,
    private readonly engine: PricingEngine,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(evaluationId: string): Promise<void> {
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        photos: { orderBy: { order: 'asc' } },
        model: { include: { brand: true, category: true } },
      },
    });
    if (!evaluation) {
      this.logger.warn(`Avaliação ${evaluationId} não encontrada — job ignorado.`);
      return;
    }

    try {
      // ── 1. Análise de fotos ────────────────────────────────────
      await this.setStatus(evaluationId, 'ANALYZING_PHOTOS');
      let conditionScore: number | null = null;
      let photoQuality = 0.3; // sem fotos ⇒ baixa confiança no componente de fotos

      if (evaluation.photos.length > 0) {
        const analysis = await this.ai.analyzeImages({
          imageUrls: evaluation.photos.map((p) => p.url),
          product: {
            name: `${evaluation.model.brand.name} ${evaluation.model.name}`,
            category: evaluation.model.category.name,
            declaredCondition: evaluation.condition,
          },
          seed: evaluation.id,
        });
        conditionScore = analysis.overallScore;
        photoQuality = Math.min(1, 0.4 + evaluation.photos.length / 15 + analysis.overallScore / 50);

        await this.prisma.conditionReport.upsert({
          where: { evaluationId },
          create: {
            evaluationId,
            overallScore: analysis.overallScore,
            summary: analysis.summary,
            findings: analysis.findings as any,
            provider: analysis.provider,
          },
          update: {
            overallScore: analysis.overallScore,
            summary: analysis.summary,
            findings: analysis.findings as any,
            provider: analysis.provider,
          },
        });
        for (const perPhoto of analysis.perPhoto) {
          const photo = evaluation.photos[perPhoto.index];
          if (photo) {
            await this.prisma.photo.update({
              where: { id: photo.id },
              data: { analysis: perPhoto.findings as any, score: perPhoto.score },
            });
          }
        }
      }

      // ── 2. Busca de mercado ────────────────────────────────────
      await this.setStatus(evaluationId, 'SEARCHING_MARKET');
      const age = evaluation.model.releaseYear
        ? Math.max(0, new Date().getFullYear() - evaluation.model.releaseYear)
        : 2;
      const referencePrice =
        (evaluation.model.msrp ?? 1500) *
        Math.pow(1 - evaluation.model.category.defaultAnnualDepreciation, age);

      const marketResult = await this.market.search({
        modelName: evaluation.model.name,
        brandName: evaluation.model.brand.name,
        categorySlug: evaluation.model.category.slug,
        referencePrice,
        condition: evaluation.condition,
      });

      await this.prisma.marketPrice.deleteMany({ where: { evaluationId } });
      await this.prisma.marketPrice.createMany({
        data: marketResult.listings.map((l) => ({
          evaluationId,
          marketplace: l.marketplace,
          title: l.title,
          price: l.price,
          url: l.url,
          sellerRating: l.sellerRating,
          conditionLabel: l.conditionLabel,
          isOutlier: l.isOutlier,
          excludedReason: l.excludedReason,
        })),
      });

      // ── 3. Precificação ────────────────────────────────────────
      await this.setStatus(evaluationId, 'PRICING');
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const history = await this.prisma.priceHistory.findMany({
        where: { modelId: evaluation.modelId, date: { gte: since } },
        orderBy: { date: 'asc' },
      });

      // sinal de demanda determinístico por modelo (0.6–1.4)
      const demandRng = seededRng(`demand:${evaluation.model.slug}`);
      const demandSignal = 0.6 + demandRng() * 0.8;

      const ctx: PricingContext = {
        currentPrice: 0,
        evaluation: {
          condition: evaluation.condition,
          conditionScore,
          year: evaluation.year,
          locationState: evaluation.locationState,
          hasInvoice: evaluation.hasInvoice,
          hasWarranty: evaluation.hasWarranty,
        },
        model: {
          releaseYear: evaluation.model.releaseYear,
          msrp: evaluation.model.msrp,
          annualDepreciation: evaluation.model.category.defaultAnnualDepreciation,
        },
        marketStats: marketResult.stats,
        history: history.map((h) => ({
          date: h.date,
          medianPrice: h.medianPrice,
          sampleSize: h.sampleSize,
        })),
        demandSignal,
      };

      const result = this.engine.run(ctx, {
        sampleSize: marketResult.stats.sampleSize,
        coefficientOfVariation: marketResult.stats.coefficientOfVariation,
        photoScore: photoQuality,
      });

      await this.prisma.priceAdjustment.deleteMany({ where: { evaluationId } });
      await this.prisma.priceAdjustment.createMany({
        data: result.adjustments.map((a, order) => ({
          evaluationId,
          stage: a.stage,
          order,
          inputPrice: a.inputPrice,
          outputPrice: a.outputPrice,
          factor: a.factor,
          reason: a.reason,
        })),
      });

      await this.prisma.evaluation.update({
        where: { id: evaluationId },
        data: {
          status: 'DONE',
          conditionScore,
          recommendedPrice: result.recommendedPrice,
          quickSalePrice: result.quickSalePrice,
          maxPrice: result.maxPrice,
          minMarketPrice: marketResult.stats.min,
          avgMarketPrice: marketResult.stats.avg,
          medianMarketPrice: marketResult.stats.median,
          confidence: result.confidence,
          estimatedDaysToSell: result.estimatedDaysToSell,
        },
      });

      await this.notifications.create(
        evaluation.userId,
        'EVALUATION_DONE',
        'Avaliação concluída',
        `Seu ${evaluation.model.brand.name} ${evaluation.model.name} foi avaliado em R$ ${result.recommendedPrice.toFixed(2)} (confiança ${(result.confidence * 100).toFixed(0)}%).`,
        { evaluationId, recommendedPrice: result.recommendedPrice },
      );
    } catch (err) {
      this.logger.error(`Pipeline da avaliação ${evaluationId} falhou: ${(err as Error).message}`);
      await this.prisma.evaluation.update({
        where: { id: evaluationId },
        data: { status: 'FAILED', failureReason: (err as Error).message.slice(0, 500) },
      });
    }
  }

  private setStatus(id: string, status: EvaluationStatus) {
    return this.prisma.evaluation.update({ where: { id }, data: { status } });
  }
}
