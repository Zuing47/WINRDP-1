import { PricingStage as PricingStageEnum, ProductCondition } from '@prisma/client';
import { MarketStats } from '../../market/stats/market-stats.calculator';

export interface HistoryPoint {
  date: Date;
  medianPrice: number;
  sampleSize: number;
}

export interface PricingContext {
  /** preço corrente ao longo do pipeline (mutável entre estágios) */
  currentPrice: number;
  evaluation: {
    condition: ProductCondition;
    conditionScore: number | null; // 0–10 vindo da análise de fotos
    year: number | null;
    locationState: string | null;
    hasInvoice: boolean;
    hasWarranty: boolean;
  };
  model: {
    releaseYear: number | null;
    msrp: number | null;
    annualDepreciation: number;
  };
  marketStats: MarketStats;
  history: HistoryPoint[]; // últimos 90 dias
  /** razão anúncios recentes/antigos + velocidade de venda (0–2, 1 = neutro) */
  demandSignal: number;
}

export interface StageResult {
  stage: PricingStageEnum;
  inputPrice: number;
  outputPrice: number;
  factor: number;
  reason: string;
}

export interface PricingStage {
  readonly stage: PricingStageEnum;
  apply(ctx: PricingContext): StageResult;
}

export const round2 = (v: number): number => Math.round(v * 100) / 100;
