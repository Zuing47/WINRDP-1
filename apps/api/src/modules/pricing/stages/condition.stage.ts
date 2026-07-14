import { PricingStage as StageEnum, ProductCondition } from '@prisma/client';
import { PricingContext, PricingStage, round2, StageResult } from './pricing-stage.interface';

const CONDITION_FALLBACK_SCORE: Record<ProductCondition, number> = {
  NEW: 9.8,
  LIKE_NEW: 9.2,
  GOOD: 8.0,
  FAIR: 6.5,
  POOR: 5.0,
  FOR_PARTS: 2.0,
};

/**
 * 3. Condição — curva score 0–10 → fator 0.45–1.08.
 * Usa o score da análise de fotos; sem fotos, usa o score típico
 * da condição declarada. Nota fiscal e garantia dão pequeno bônus.
 */
export class ConditionStage implements PricingStage {
  readonly stage = StageEnum.CONDITION;

  /** Interpolação linear na curva 0 → 0.45, 10 → 1.08 (8.5 ≈ 0.99). */
  static factorForScore(score: number): number {
    const clamped = Math.max(0, Math.min(10, score));
    return round2(0.45 + (clamped / 10) * (1.08 - 0.45));
  }

  apply(ctx: PricingContext): StageResult {
    const input = ctx.currentPrice;
    const fromPhotos = ctx.evaluation.conditionScore !== null;
    const score = ctx.evaluation.conditionScore ?? CONDITION_FALLBACK_SCORE[ctx.evaluation.condition];

    let factor = ConditionStage.factorForScore(score);
    const bonuses: string[] = [];
    if (ctx.evaluation.hasInvoice) {
      factor = round2(factor * 1.02);
      bonuses.push('nota fiscal (+2%)');
    }
    if (ctx.evaluation.hasWarranty) {
      factor = round2(factor * 1.03);
      bonuses.push('garantia vigente (+3%)');
    }

    return {
      stage: this.stage,
      inputPrice: input,
      outputPrice: round2(input * factor),
      factor,
      reason:
        `Nota de condição ${score.toFixed(1)}/10 ` +
        (fromPhotos ? '(análise de fotos por IA)' : '(condição declarada, sem fotos)') +
        ` aplicada à curva de condição (0→×0,45 · 10→×1,08)` +
        (bonuses.length ? `; bônus: ${bonuses.join(', ')}` : '') +
        '.',
    };
  }
}
