import { ProductCondition } from '@prisma/client';
import { MarketStats } from '../../market/stats/market-stats.calculator';
import { AgeStage } from '../stages/age.stage';
import { BaseStage } from '../stages/base.stage';
import { ConditionStage } from '../stages/condition.stage';
import { DemandStage } from '../stages/demand.stage';
import { HistoryStage } from '../stages/history.stage';
import { PricingContext } from '../stages/pricing-stage.interface';
import { REGION_FACTORS, RegionStage } from '../stages/region.stage';
import { PricingEngine } from './pricing-engine';

function stats(overrides: Partial<MarketStats> = {}): MarketStats {
  return {
    min: 1000,
    max: 2000,
    avg: 1500,
    median: 1500,
    stddev: 150,
    sampleSize: 20,
    coefficientOfVariation: 0.1,
    ...overrides,
  };
}

function baseContext(overrides: Partial<PricingContext> = {}): PricingContext {
  return {
    currentPrice: 0,
    evaluation: {
      condition: ProductCondition.GOOD,
      conditionScore: 8,
      year: 2023,
      locationState: 'SP',
      hasInvoice: false,
      hasWarranty: false,
    },
    model: { releaseYear: 2023, msrp: 5000, annualDepreciation: 0.2 },
    marketStats: stats(),
    history: [],
    demandSignal: 1,
    ...overrides,
  };
}

describe('BaseStage', () => {
  it('usa a mediana de mercado quando há amostras', () => {
    const result = new BaseStage().apply(baseContext());
    expect(result.outputPrice).toBe(1500);
  });

  it('cai para o msrp depreciado quando não há amostras', () => {
    const ctx = baseContext({ marketStats: stats({ median: 0, sampleSize: 0 }) });
    const result = new BaseStage().apply(ctx);
    expect(result.outputPrice).toBeGreaterThan(0);
    expect(result.reason).toContain('lançamento');
  });
});

describe('AgeStage', () => {
  it('não ajusta quando o ano é igual ao típico do modelo', () => {
    const ctx = baseContext({ currentPrice: 1500 });
    const result = new AgeStage().apply(ctx);
    expect(result.factor).toBe(1);
    expect(result.outputPrice).toBe(1500);
  });

  it('aumenta o preço quando o exemplar é mais novo que o típico', () => {
    const ctx = baseContext({
      currentPrice: 1500,
      evaluation: { ...baseContext().evaluation, year: 2025 },
      model: { releaseYear: 2023, msrp: 5000, annualDepreciation: 0.2 },
    });
    const result = new AgeStage().apply(ctx);
    expect(result.factor).toBeGreaterThan(1);
  });

  it('sem ano informado não ajusta', () => {
    const ctx = baseContext({ currentPrice: 1500, evaluation: { ...baseContext().evaluation, year: null } });
    const result = new AgeStage().apply(ctx);
    expect(result.factor).toBe(1);
  });
});

describe('ConditionStage', () => {
  it('mapeia score 10 para fator 1.08 e score 0 para 0.45', () => {
    expect(ConditionStage.factorForScore(10)).toBeCloseTo(1.08, 2);
    expect(ConditionStage.factorForScore(0)).toBeCloseTo(0.45, 2);
  });

  it('aplica bônus de nota fiscal e garantia', () => {
    const withBonus = new ConditionStage().apply(
      baseContext({ currentPrice: 1000, evaluation: { ...baseContext().evaluation, hasInvoice: true, hasWarranty: true } }),
    );
    const withoutBonus = new ConditionStage().apply(baseContext({ currentPrice: 1000 }));
    expect(withBonus.outputPrice).toBeGreaterThan(withoutBonus.outputPrice);
  });

  it('usa score típico da condição quando não há fotos', () => {
    const result = new ConditionStage().apply(
      baseContext({ currentPrice: 1000, evaluation: { ...baseContext().evaluation, conditionScore: null, condition: ProductCondition.POOR } }),
    );
    expect(result.reason).toContain('sem fotos');
  });
});

describe('DemandStage', () => {
  it('respeita o limite de ±8%', () => {
    const high = new DemandStage().apply(baseContext({ currentPrice: 1000, demandSignal: 2 }));
    const low = new DemandStage().apply(baseContext({ currentPrice: 1000, demandSignal: 0 }));
    expect(high.factor).toBeCloseTo(1.08, 2);
    expect(low.factor).toBeCloseTo(0.92, 2);
  });

  it('sinal neutro não altera o preço', () => {
    const neutral = new DemandStage().apply(baseContext({ currentPrice: 1000, demandSignal: 1 }));
    expect(neutral.factor).toBe(1);
  });
});

describe('RegionStage', () => {
  it('SP é a referência (fator 1.00)', () => {
    const result = new RegionStage().apply(baseContext({ currentPrice: 1000, evaluation: { ...baseContext().evaluation, locationState: 'SP' } }));
    expect(result.factor).toBe(1);
  });

  it('aplica fator de UFs fora da referência', () => {
    const result = new RegionStage().apply(baseContext({ currentPrice: 1000, evaluation: { ...baseContext().evaluation, locationState: 'AC' } }));
    expect(result.factor).toBe(REGION_FACTORS.AC);
  });

  it('sem UF não ajusta', () => {
    const result = new RegionStage().apply(baseContext({ currentPrice: 1000, evaluation: { ...baseContext().evaluation, locationState: null } }));
    expect(result.factor).toBe(1);
  });
});

describe('HistoryStage', () => {
  const historyOf = (prices: number[]) => prices.map((p, i) => ({ date: new Date(2024, 0, i + 1), medianPrice: p, sampleSize: 10 }));

  it('sem histórico suficiente não ajusta', () => {
    const result = new HistoryStage().apply(baseContext({ currentPrice: 1000, history: historyOf([1000, 1000]) }));
    expect(result.factor).toBe(1);
  });

  it('suaviza em direção à tendência quando desvio > 10%', () => {
    const history = historyOf(new Array(10).fill(1000));
    const result = new HistoryStage().apply(baseContext({ currentPrice: 1300, history }));
    expect(result.outputPrice).toBeLessThan(1300);
    expect(result.outputPrice).toBeGreaterThan(1000);
  });

  it('dentro de 10% de desvio não ajusta', () => {
    const history = historyOf(new Array(10).fill(1000));
    const result = new HistoryStage().apply(baseContext({ currentPrice: 1050, history }));
    expect(result.factor).toBe(1);
  });
});

describe('PricingEngine (pipeline completo)', () => {
  const engine = new PricingEngine();

  it('executa os 6 estágios em ordem e retorna preços derivados', () => {
    const ctx = baseContext({ currentPrice: 0 });
    const result = engine.run(ctx, { sampleSize: 30, coefficientOfVariation: 0.15, photoScore: 0.8 });

    expect(result.adjustments).toHaveLength(6);
    expect(result.adjustments.map((a) => a.stage)).toEqual([
      'BASE', 'AGE', 'CONDITION', 'DEMAND', 'REGION', 'HISTORY',
    ]);
    expect(result.recommendedPrice).toBeGreaterThan(0);
    expect(result.quickSalePrice).toBeCloseTo(result.recommendedPrice * 0.88, 1);
    expect(result.maxPrice).toBeCloseTo(result.recommendedPrice * 1.09, 1);
    expect(result.estimatedDaysToSell).toBeGreaterThanOrEqual(2);
  });

  it('confidence cresce com mais amostras, menor dispersão e melhores fotos, respeitando o cap de 97%', () => {
    const low = engine.confidence({ sampleSize: 2, coefficientOfVariation: 0.6, photoScore: 0.1 });
    const high = engine.confidence({ sampleSize: 45, coefficientOfVariation: 0.05, photoScore: 1 });
    expect(high).toBeGreaterThan(low);
    expect(high).toBeLessThanOrEqual(0.97);
  });
});
