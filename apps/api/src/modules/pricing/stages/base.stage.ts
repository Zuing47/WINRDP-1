import { PricingStage as StageEnum } from '@prisma/client';
import { PricingContext, PricingStage, round2, StageResult } from './pricing-stage.interface';

/** 1. Base = mediana de mercado (robusta a outliers). */
export class BaseStage implements PricingStage {
  readonly stage = StageEnum.BASE;

  apply(ctx: PricingContext): StageResult {
    const input = ctx.currentPrice;
    let base = ctx.marketStats.median;
    let reason = `Preço base definido pela mediana de ${ctx.marketStats.sampleSize} anúncios válidos coletados (mediana robusta a outliers).`;

    if (!base || ctx.marketStats.sampleSize === 0) {
      // fallback: msrp depreciado quando não há mercado
      const age = ctx.model.releaseYear
        ? Math.max(0, new Date().getFullYear() - ctx.model.releaseYear)
        : 2;
      base = (ctx.model.msrp ?? 1000) * Math.pow(1 - ctx.model.annualDepreciation, age);
      reason = `Sem anúncios válidos no mercado — base estimada pelo preço de lançamento (MSRP) com depreciação da categoria.`;
    }

    return {
      stage: this.stage,
      inputPrice: input,
      outputPrice: round2(base),
      factor: input > 0 ? round2(base / input) : 1,
      reason,
    };
  }
}
