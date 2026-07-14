import { Injectable } from '@nestjs/common';
import { AgeStage } from '../stages/age.stage';
import { BaseStage } from '../stages/base.stage';
import { ConditionStage } from '../stages/condition.stage';
import { DemandStage } from '../stages/demand.stage';
import { HistoryStage } from '../stages/history.stage';
import {
  PricingContext,
  PricingStage,
  round2,
  StageResult,
} from '../stages/pricing-stage.interface';
import { RegionStage } from '../stages/region.stage';

export interface PricingResult {
  recommendedPrice: number;
  quickSalePrice: number; // −12%
  maxPrice: number; // +9%
  confidence: number; // 0–1 (cap 0.97)
  estimatedDaysToSell: number;
  adjustments: StageResult[];
}

export interface ConfidenceInputs {
  sampleSize: number;
  coefficientOfVariation: number;
  /** 0–1: qualidade/quantidade da análise de fotos */
  photoScore: number;
}

/**
 * Engine modular: executa o pipeline fixo BASE → AGE → CONDITION →
 * DEMAND → REGION → HISTORY. Cada estágio é puro e auditável — os
 * ajustes retornados são persistidos em price_adjustments.
 */
@Injectable()
export class PricingEngine {
  private readonly stages: PricingStage[] = [
    new BaseStage(),
    new AgeStage(),
    new ConditionStage(),
    new DemandStage(),
    new RegionStage(),
    new HistoryStage(),
  ];

  run(ctx: PricingContext, confidenceInputs: ConfidenceInputs): PricingResult {
    const adjustments: StageResult[] = [];
    for (const stage of this.stages) {
      const result = stage.apply(ctx);
      adjustments.push(result);
      ctx.currentPrice = result.outputPrice;
    }

    const recommendedPrice = round2(ctx.currentPrice);
    const confidence = this.confidence(confidenceInputs);

    return {
      recommendedPrice,
      quickSalePrice: round2(recommendedPrice * 0.88),
      maxPrice: round2(recommendedPrice * 1.09),
      confidence,
      estimatedDaysToSell: this.estimatedDaysToSell(ctx, recommendedPrice),
      adjustments,
    };
  }

  /**
   * confidence = f(sampleSize, coeficiente de variação, score de fotos).
   * 40+ anúncios com baixa dispersão e boas fotos ⇒ 92%+. Cap em 97%.
   */
  confidence({ sampleSize, coefficientOfVariation, photoScore }: ConfidenceInputs): number {
    const sampleComponent = Math.min(1, sampleSize / 40); // satura em 40 amostras
    const dispersionComponent = Math.max(0, 1 - Math.min(1, coefficientOfVariation / 0.5));
    const photoComponent = Math.max(0, Math.min(1, photoScore));
    const raw = 0.5 * sampleComponent + 0.3 * dispersionComponent + 0.2 * photoComponent;
    return round2(Math.min(0.97, Math.max(0.2, 0.25 + raw * 0.75)));
  }

  /** dias p/ vender = f(demanda, posição do preço no range de mercado). */
  private estimatedDaysToSell(ctx: PricingContext, price: number): number {
    const { min, max } = ctx.marketStats;
    const range = max - min;
    // posição 0 (mais barato) → vende rápido; 1 (mais caro) → devagar
    const position = range > 0 ? Math.max(0, Math.min(1, (price - min) / range)) : 0.5;
    const demand = Math.max(0.25, Math.min(2, ctx.demandSignal));
    const days = (5 + position * 25) / demand;
    return Math.max(2, Math.min(60, Math.round(days)));
  }
}
