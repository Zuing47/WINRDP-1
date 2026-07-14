import { PricingStage as StageEnum } from '@prisma/client';
import { PricingContext, PricingStage, round2, StageResult } from './pricing-stage.interface';

/**
 * 2. Idade — a mediana de mercado já embute depreciação média;
 * aqui ajustamos o delta entre a idade DESTE exemplar (ano declarado)
 * e a idade típica do modelo (release_year), com a curva da categoria.
 */
export class AgeStage implements PricingStage {
  readonly stage = StageEnum.AGE;

  apply(ctx: PricingContext): StageResult {
    const input = ctx.currentPrice;
    const { year } = ctx.evaluation;
    const { releaseYear, annualDepreciation } = ctx.model;

    if (!year || !releaseYear) {
      return {
        stage: this.stage,
        inputPrice: input,
        outputPrice: input,
        factor: 1,
        reason: 'Ano do exemplar não informado — sem ajuste de idade.',
      };
    }

    const deltaYears = year - releaseYear; // exemplar mais novo que o típico ⇒ positivo
    // meio passo da curva por ano de diferença, limitado a ±3 anos
    const clamped = Math.max(-3, Math.min(3, deltaYears));
    const factor = round2(Math.pow(1 - annualDepreciation * 0.5, -clamped));
    const output = round2(input * factor);
    const dir = clamped >= 0 ? 'mais novo' : 'mais antigo';

    return {
      stage: this.stage,
      inputPrice: input,
      outputPrice: output,
      factor,
      reason:
        clamped === 0
          ? `Exemplar do ano típico do modelo (${releaseYear}) — sem ajuste de idade.`
          : `Exemplar ${Math.abs(clamped)} ano(s) ${dir} que o típico do modelo; depreciação anual da categoria de ${(annualDepreciation * 100).toFixed(0)}% aplicada pela metade sobre a diferença.`,
    };
  }
}
