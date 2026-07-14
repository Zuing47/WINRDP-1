export interface MarketStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  stddev: number;
  sampleSize: number;
  /** coeficiente de variação (stddev/avg) — mede dispersão relativa */
  coefficientOfVariation: number;
}

export class MarketStatsCalculator {
  calculate(prices: number[]): MarketStats {
    if (prices.length === 0) {
      return { min: 0, max: 0, avg: 0, median: 0, stddev: 0, sampleSize: 0, coefficientOfVariation: 0 };
    }
    const sorted = [...prices].sort((a, b) => a - b);
    const n = sorted.length;
    const avg = sorted.reduce((a, b) => a + b, 0) / n;
    const median =
      n % 2 === 1 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const stddev = Math.sqrt(sorted.reduce((a, p) => a + (p - avg) ** 2, 0) / n);
    return {
      min: sorted[0],
      max: sorted[n - 1],
      avg: round2(avg),
      median: round2(median),
      stddev: round2(stddev),
      sampleSize: n,
      coefficientOfVariation: avg > 0 ? round2(stddev / avg) : 0,
    };
  }
}

const round2 = (v: number): number => Math.round(v * 100) / 100;
