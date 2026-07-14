import { PricingStage as StageEnum } from '@prisma/client';
import { PricingContext, PricingStage, round2, StageResult } from './pricing-stage.interface';

/** Tabela de fatores regionais por UF (SP = 1.00, referência). */
export const REGION_FACTORS: Record<string, number> = {
  SP: 1.0, RJ: 0.99, MG: 0.97, PR: 0.97, SC: 0.98, RS: 0.97,
  DF: 0.99, GO: 0.95, MS: 0.94, MT: 0.94,
  BA: 0.94, PE: 0.94, CE: 0.93, RN: 0.92, PB: 0.92, AL: 0.92, SE: 0.92, PI: 0.91, MA: 0.91,
  ES: 0.96, TO: 0.92, PA: 0.92, AM: 0.93, RO: 0.91, AC: 0.90, RR: 0.90, AP: 0.90,
};

/** 5. Região — ajuste por UF (liquidez e poder de compra locais). */
export class RegionStage implements PricingStage {
  readonly stage = StageEnum.REGION;

  apply(ctx: PricingContext): StageResult {
    const input = ctx.currentPrice;
    const uf = ctx.evaluation.locationState?.toUpperCase() ?? null;
    const factor = uf && REGION_FACTORS[uf] !== undefined ? REGION_FACTORS[uf] : 1.0;

    return {
      stage: this.stage,
      inputPrice: input,
      outputPrice: round2(input * factor),
      factor,
      reason: !uf
        ? 'Localização não informada — sem ajuste regional.'
        : factor === 1
          ? `UF ${uf} é a referência nacional (fator 1,00) — sem ajuste regional.`
          : `Fator regional de ${uf}: ×${factor.toFixed(2)} (mercado local vs. referência SP).`,
    };
  }
}
