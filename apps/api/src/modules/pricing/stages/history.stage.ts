import { PricingStage as StageEnum } from '@prisma/client';
import { PricingContext, PricingStage, round2, StageResult } from './pricing-stage.interface';

/**
 * 6. Histórico — suaviza contra a tendência de 90 dias, evitando que
 * um pico/queda momentâneo do mercado contamine o preço recomendado.
 * Puxa o preço 25% em direção à mediana histórica quando o desvio
 * passa de 10%.
 */
export class HistoryStage implements PricingStage {
  readonly stage = StageEnum.HISTORY;

  apply(ctx: PricingContext): StageResult {
    const input = ctx.currentPrice;
    if (ctx.history.length < 7) {
      return {
        stage: this.stage,
        inputPrice: input,
        outputPrice: input,
        factor: 1,
        reason: 'Histórico de preços insuficiente (< 7 dias) — sem suavização.',
      };
    }

    const historicalMedian = median(ctx.history.map((h) => h.medianPrice));
    const deviation = historicalMedian > 0 ? input / historicalMedian - 1 : 0;

    if (Math.abs(deviation) <= 0.1) {
      return {
        stage: this.stage,
        inputPrice: input,
        outputPrice: input,
        factor: 1,
        reason: `Preço alinhado à tendência de 90 dias (desvio de ${(deviation * 100).toFixed(1)}% da mediana histórica de R$ ${historicalMedian.toFixed(0)}) — sem ajuste.`,
      };
    }

    const output = round2(input + (historicalMedian - input) * 0.25);
    const factor = round2(output / input);
    const dir = deviation > 0 ? 'acima' : 'abaixo';

    return {
      stage: this.stage,
      inputPrice: input,
      outputPrice: output,
      factor,
      reason: `Mercado atual está ${(Math.abs(deviation) * 100).toFixed(1)}% ${dir} da tendência de 90 dias (mediana histórica R$ ${historicalMedian.toFixed(0)}) — suavização de 25% em direção à tendência para evitar pico/queda momentânea.`,
    };
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  return n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}
