import type {
  Condition,
  Evaluation,
  EvaluationPhoto,
  MarketListing,
  Marketplace,
  MarketStats,
  Model,
  PriceAdjustment,
  PricePoint,
} from "@/lib/types";
import { brands, categories, regionFactors, rng } from "./seed";

import { conditionLabels } from "@/lib/labels";

const conditionScoreBase: Record<Condition, number> = {
  NEW: 9.8,
  EXCELLENT: 9.4,
  GOOD: 8.2,
  FAIR: 6.6,
  POOR: 4.4,
};

const marketplaces: Marketplace[] = [
  "MERCADO_LIVRE",
  "OLX",
  "FACEBOOK_MARKETPLACE",
  "EBAY",
  "AMAZON",
  "MAGAZINE_LUIZA",
];

const excludedReasons = [
  "Anúncio de lote/kit — quantidade maior que 1",
  "Item descrito como \"para peças\" ou \"não liga\"",
  "Provável réplica — termos \"primeira linha\" no título",
  "Preço fora do intervalo estatístico (média ± 2,5σ)",
  "Duplicado — mesmo vendedor, título e preço",
  "Tela trincada declarada na descrição",
  "Baixa relevância — título não corresponde ao modelo",
];

const titleSuffixes = [
  "impecável, na caixa",
  "pouco uso, com nota fiscal",
  "bem conservado",
  "aceito troca",
  "único dono",
  "com garantia até 2026",
  "sem detalhes, funcionando 100%",
  "leia a descrição",
  "entrego em mãos",
  "novo lacrado (aberto só p/ testar)",
];

const excludedTitlePrefixes = [
  "LOTE 3x",
  "PARA PEÇAS —",
  "Réplica primeira linha",
  "SUCATA",
  "Kit com 2 —",
];

function round(v: number): number {
  return Math.round(v / 10) * 10;
}

export function generateListings(model: Model, seed: string): { listings: MarketListing[]; stats: MarketStats; median: number } {
  const r = rng(`listings:${model.id}:${seed}`);
  const age = Math.max(0, new Date().getFullYear() - model.releaseYear);
  const cat = categories.find((c) => c.id === model.categoryId);
  const dep = cat?.annualDepreciation ?? 0.15;
  const median = model.msrp * Math.pow(1 - dep, age) * (0.78 + r() * 0.12);
  const count = 26 + Math.floor(r() * 22);
  const excludedCount = 5 + Math.floor(r() * 4);
  const listings: MarketListing[] = [];

  for (let i = 0; i < count; i++) {
    const excluded = i < excludedCount;
    const spread = excluded ? 0.25 + r() * 1.6 : 0.82 + r() * 0.4;
    const daysAgo = Math.floor(r() * 21);
    listings.push({
      id: `lst-${model.id}-${seed}-${i}`,
      marketplace: marketplaces[Math.floor(r() * marketplaces.length)],
      title: excluded
        ? `${excludedTitlePrefixes[i % excludedTitlePrefixes.length]} ${model.name}`
        : `${model.name} ${titleSuffixes[Math.floor(r() * titleSuffixes.length)]}`,
      price: round(median * spread),
      url: "#",
      sellerRating: Math.round((3.6 + r() * 1.4) * 10) / 10,
      conditionLabel: r() > 0.4 ? "Usado" : "Seminovo",
      excludedReason: excluded ? excludedReasons[Math.floor(r() * excludedReasons.length)] : null,
      collectedAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    });
  }

  const valid = listings.filter((l) => !l.excludedReason).map((l) => l.price).sort((a, b) => a - b);
  const stats: MarketStats = {
    min: valid[0],
    max: valid[valid.length - 1],
    avg: round(valid.reduce((s, v) => s + v, 0) / valid.length),
    median: valid[Math.floor(valid.length / 2)],
    sampleSize: valid.length,
    excludedCount,
  };
  // embaralha para exibição (mantendo determinismo)
  listings.sort(() => r() - 0.5);
  return { listings, stats, median: stats.median };
}

export function generateBreakdown(
  model: Model,
  median: number,
  condition: Condition,
  year: number,
  state: string,
  conditionScore: number,
  seed: string
): { breakdown: PriceAdjustment[]; recommended: number } {
  const r = rng(`breakdown:${model.id}:${seed}`);
  const nowYear = new Date().getFullYear();
  const age = Math.max(0, nowYear - year);
  const cat = categories.find((c) => c.id === model.categoryId);
  const steps: PriceAdjustment[] = [];
  let price = median;

  const push = (stage: PriceAdjustment["stage"], factor: number, reason: string) => {
    const input = price;
    const output = round(input * factor);
    steps.push({ stage, order: steps.length + 1, inputPrice: round(input), outputPrice: output, factor, reason });
    price = output;
  };

  push("BASE", 1, `Preço base definido pela mediana de mercado — robusta a outliers entre os anúncios válidos coletados.`);

  const ageFactor = age === 0 ? 1 : Math.max(0.85, 1 - age * 0.018);
  push(
    "AGE",
    Number(ageFactor.toFixed(3)),
    age === 0
      ? "Modelo do ano corrente — sem depreciação adicional sobre a amostra de mercado."
      : `Unidade de ${year} (${age} ano${age > 1 ? "s" : ""} de uso) — depreciação adicional de ${((1 - ageFactor) * 100).toFixed(1)}% sobre a curva da categoria ${cat?.name ?? ""}.`
  );

  const condFactor = Number((0.45 + conditionScore * 0.063).toFixed(3));
  push(
    "CONDITION",
    condFactor,
    `Nota de condição ${conditionScore.toFixed(1)}/10 (${conditionLabels[condition]}) aplicada à curva de condição → fator ${condFactor.toFixed(2)}.`
  );

  const demand = Number((0.96 + r() * 0.1).toFixed(3));
  push(
    "DEMAND",
    demand,
    demand >= 1
      ? `Alta liquidez: volume de anúncios recentes ${Math.round((demand - 1) * 100 + 8)}% acima da média do modelo — mercado aquecido.`
      : "Demanda levemente abaixo da média nos últimos 14 dias — ajuste conservador."
  );

  const region = regionFactors[state] ?? 0.96;
  push(
    "REGION",
    region,
    region >= 1
      ? `Região ${state}: mercado de referência nacional — sem ajuste regional.`
      : `Região ${state}: fator regional de ${region.toFixed(2)} pela menor liquidez local em relação a SP.`
  );

  const hist = Number((0.985 + r() * 0.03).toFixed(3));
  push(
    "HISTORY",
    hist,
    hist >= 1
      ? "Tendência de 90 dias em leve alta — suavização positiva para evitar subprecificação momentânea."
      : "Suavizado contra a média de 90 dias para neutralizar queda pontual da última semana."
  );

  return { breakdown: steps, recommended: price };
}

const findingTypes = [
  { type: "Micro-riscos", location: "traseira" },
  { type: "Desgaste leve", location: "bordas laterais" },
  { type: "Arranhão superficial", location: "canto inferior direito" },
  { type: "Sinais de uso", location: "área dos botões" },
  { type: "Poeira interna", location: "lente/abertura" },
];

export function generatePhotos(count: number, condition: Condition, seed: string): EvaluationPhoto[] {
  const r = rng(`photos:${seed}`);
  const base = conditionScoreBase[condition];
  return Array.from({ length: count }, (_, i) => {
    const hasFinding = condition !== "NEW" && r() > 0.55;
    const f = findingTypes[Math.floor(r() * findingTypes.length)];
    return {
      id: `photo-${seed}-${i}`,
      url: "",
      order: i,
      findings: hasFinding
        ? [{ type: f.type, severity: Math.round(r() * 30) / 100, location: f.location, confidence: Math.round((0.82 + r() * 0.16) * 100) / 100 }]
        : [],
      partialScore: Math.round((base + (r() - 0.5) * 0.8) * 10) / 10,
    };
  });
}

export function buildConditionSummary(modelName: string, condition: Condition, score: number, photos: EvaluationPhoto[]): string {
  const defects = photos.flatMap((p) => p.findings);
  if (condition === "NEW" || defects.length === 0) {
    return `O ${modelName} apresenta estado impecável nas ${photos.length} fotos analisadas. Não foram detectados riscos, trincas, oxidação ou sinais de desgaste relevantes. Acabamento e tela íntegros, condizentes com a nota ${score.toFixed(1)}/10.`;
  }
  const kinds = Array.from(new Set(defects.map((d) => d.type.toLowerCase())));
  return `A análise das ${photos.length} fotos identificou ${defects.length} apontamento${defects.length > 1 ? "s" : ""} de baixa severidade (${kinds.join(", ")}). Não há danos estruturais, trincas de tela ou oxidação. O conjunto é consistente com um aparelho bem cuidado, resultando na nota ${score.toFixed(1)}/10.`;
}

export function buildEvaluation(params: {
  id: string;
  model: Model;
  condition: Condition;
  year: number;
  attributes: Record<string, string>;
  hasInvoice: boolean;
  hasWarranty: boolean;
  accessories: string[];
  location: { city: string; state: string };
  photoCount: number;
  createdAt: string;
  status?: Evaluation["status"];
}): Evaluation {
  const { id, model } = params;
  const brand = brands.find((br) => br.id === model.brandId);
  const cat = categories.find((c) => c.id === model.categoryId);
  const r = rng(`eval:${id}`);

  const { listings, stats, median } = generateListings(model, id);
  const score = Math.round((conditionScoreBase[params.condition] + (r() - 0.5) * 0.5) * 10) / 10;
  const photos = generatePhotos(params.photoCount, params.condition, id);
  const { breakdown, recommended } = generateBreakdown(
    model, median, params.condition, params.year, params.location.state, score, id
  );

  const bonus = (params.hasInvoice ? 0.015 : 0) + (params.hasWarranty ? 0.02 : 0) + params.accessories.length * 0.004;
  const final = Math.round((recommended * (1 + bonus)) / 10) * 10;
  const confidence = Math.min(97, Math.round(58 + stats.sampleSize * 0.6 + params.photoCount * 1.3 + (params.hasInvoice ? 2 : 0)));
  const daysToSell = Math.max(3, Math.round(16 - confidence * 0.09 - (params.condition === "POOR" ? -6 : 0)));

  return {
    id,
    userId: "user-demo",
    modelId: model.id,
    modelName: model.name,
    brandName: brand?.name ?? "",
    categoryId: cat?.id ?? "",
    categorySlug: cat?.slug ?? "",
    categoryName: cat?.name ?? "",
    status: params.status ?? "DONE",
    condition: params.condition,
    year: params.year,
    attributes: params.attributes,
    hasInvoice: params.hasInvoice,
    hasWarranty: params.hasWarranty,
    accessories: params.accessories,
    location: params.location,
    conditionScore: score,
    conditionReport: {
      overallScore: score,
      summary: buildConditionSummary(model.name, params.condition, score, photos),
      provider: "Claude (Anthropic) — visão computacional",
    },
    prices: {
      recommended: final,
      quickSale: Math.round((final * 0.88) / 10) * 10,
      max: Math.round((final * 1.09) / 10) * 10,
    },
    marketStats: stats,
    confidence,
    estimatedDaysToSell: daysToSell,
    photos,
    breakdown,
    listings,
    createdAt: params.createdAt,
  };
}

export function generatePriceHistory(model: Model, days = 90): PricePoint[] {
  const r = rng(`history:${model.id}`);
  const { median } = generateListings(model, "hist");
  const points: PricePoint[] = [];
  let value = median * (0.94 + r() * 0.08);
  const drift = (median - value) / days;
  for (let i = days; i >= 0; i--) {
    value = value + drift + (r() - 0.5) * median * 0.012;
    const avg = Math.round(value);
    points.push({
      date: new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10),
      avg,
      min: Math.round(avg * (0.86 + r() * 0.04)),
      max: Math.round(avg * (1.1 + r() * 0.05)),
    });
  }
  return points;
}

export function generateSparkline(seedStr: string, base: number, points = 20): number[] {
  const r = rng(`spark:${seedStr}`);
  let v = base * (0.96 + r() * 0.06);
  return Array.from({ length: points }, () => {
    v += (r() - 0.48) * base * 0.02;
    return Math.round(v);
  });
}
