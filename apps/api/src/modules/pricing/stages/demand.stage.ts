import { PricingStage as StageEnum } from '@prisma/client';
import { PricingContext, PricingStage, round2, StageResult } from './pricing-stage.interface';

/**
 * 4. Demanda — ±8% conforme o sinal de demanda (0–2, 1 = neutro),
 * derivado da razão anúncios recentes/antigos e velocidade de venda.
 */
export class DemandStage implements PricingStage {
  readonly stage = StageEnum.DEMAND;

  apply(ctx: PricingContext): StageResult {
    const input = ctx.currentPrice;
    const signal = Math.max(0, Math.min(2, ctx.demandSignal));
    // signal 0 → −8%, 1 → 0%, 2 → +8%
    const factor = round2(1 + (signal - 1) * 0.08);
    const pct = ((factor - 1) * 100).toFixed(1);
    const label = signal > 1.15 ? 'alta' : signal < 0.85 ? 'baixa' : 'neutra';

    return {
      stage: this.stage,
      inputPrice: input,
      outputPrice: round2(input * factor),
      factor,
      reason: `Demanda ${label} para o modelo (sinal ${signal.toFixed(2)}): ajuste de ${Number(pct) >= 0 ? '+' : ''}${pct}% dentro do limite de ±8%.`,
    };
  }
}
