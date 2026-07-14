/* eslint-disable no-console */
import { PrismaClient, ProductCondition } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { mulberry32, hashString, pick, randBetween, randInt } from '../src/common/utils/random';

const prisma = new PrismaClient();

// ─── Categorias ────────────────────────────────────────────────────
const CATEGORIES = [
  { slug: 'celular', name: 'Celular', icon: 'smartphone', depreciation: 0.22,
    attrs: [{ key: 'capacidade', label: 'Capacidade', type: 'select', options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
            { key: 'cor', label: 'Cor', type: 'text' }] },
  { slug: 'notebook', name: 'Notebook', icon: 'laptop', depreciation: 0.2,
    attrs: [{ key: 'ram', label: 'Memória RAM', type: 'select', options: ['8GB', '16GB', '32GB', '64GB'] },
            { key: 'armazenamento', label: 'Armazenamento', type: 'select', options: ['256GB', '512GB', '1TB', '2TB'] }] },
  { slug: 'console', name: 'Console', icon: 'gamepad-2', depreciation: 0.12,
    attrs: [{ key: 'armazenamento', label: 'Armazenamento', type: 'select', options: ['500GB', '825GB', '1TB', '2TB'] }] },
  { slug: 'tv', name: 'TV', icon: 'tv', depreciation: 0.18,
    attrs: [{ key: 'polegadas', label: 'Tamanho (polegadas)', type: 'select', options: ['32', '43', '50', '55', '65', '75'] }] },
  { slug: 'camera', name: 'Câmera', icon: 'camera', depreciation: 0.15,
    attrs: [{ key: 'megapixels', label: 'Megapixels', type: 'text' }] },
  { slug: 'drone', name: 'Drone', icon: 'plane', depreciation: 0.2,
    attrs: [{ key: 'autonomia', label: 'Autonomia (min)', type: 'text' }] },
  { slug: 'ferramenta', name: 'Ferramenta', icon: 'wrench', depreciation: 0.1,
    attrs: [{ key: 'voltagem', label: 'Voltagem', type: 'select', options: ['110V', '220V', 'bivolt'] }] },
  { slug: 'moveis', name: 'Móveis', icon: 'sofa', depreciation: 0.08,
    attrs: [{ key: 'material', label: 'Material', type: 'text' }] },
  { slug: 'instrumentos-musicais', name: 'Instrumentos Musicais', icon: 'music', depreciation: 0.07,
    attrs: [{ key: 'cor', label: 'Cor', type: 'text' }] },
  { slug: 'veiculos', name: 'Veículos', icon: 'car', depreciation: 0.14,
    attrs: [{ key: 'quilometragem', label: 'Quilometragem', type: 'text' },
            { key: 'combustivel', label: 'Combustível', type: 'select', options: ['Flex', 'Gasolina', 'Diesel', 'Elétrico', 'Híbrido'] }] },
];

// ─── Marcas (nome -> categorias em que atua) ────────────────────────
const BRANDS: Array<{ name: string; slug: string; categories: string[] }> = [
  { name: 'Apple', slug: 'apple', categories: ['celular', 'notebook'] },
  { name: 'Samsung', slug: 'samsung', categories: ['celular', 'tv'] },
  { name: 'Xiaomi', slug: 'xiaomi', categories: ['celular'] },
  { name: 'Motorola', slug: 'motorola', categories: ['celular'] },
  { name: 'Dell', slug: 'dell', categories: ['notebook'] },
  { name: 'Lenovo', slug: 'lenovo', categories: ['notebook'] },
  { name: 'Sony', slug: 'sony', categories: ['console', 'camera', 'tv'] },
  { name: 'Microsoft', slug: 'microsoft', categories: ['console'] },
  { name: 'Nintendo', slug: 'nintendo', categories: ['console'] },
  { name: 'LG', slug: 'lg', categories: ['tv'] },
  { name: 'Canon', slug: 'canon', categories: ['camera'] },
  { name: 'DJI', slug: 'dji', categories: ['drone'] },
  { name: 'Bosch', slug: 'bosch', categories: ['ferramenta'] },
  { name: 'Fender', slug: 'fender', categories: ['instrumentos-musicais'] },
  { name: 'Honda', slug: 'honda', categories: ['veiculos'] },
];

// ─── Modelos ─────────────────────────────────────────────────────────
const MODELS: Array<{
  brand: string;
  category: string;
  name: string;
  slug: string;
  releaseYear: number;
  msrp: number;
}> = [
  { brand: 'apple', category: 'celular', name: 'iPhone 15 Pro', slug: 'iphone-15-pro', releaseYear: 2023, msrp: 9299 },
  { brand: 'apple', category: 'celular', name: 'iPhone 14', slug: 'iphone-14', releaseYear: 2022, msrp: 6999 },
  { brand: 'apple', category: 'celular', name: 'iPhone 13', slug: 'iphone-13', releaseYear: 2021, msrp: 5999 },
  { brand: 'apple', category: 'celular', name: 'iPhone SE (3ª geração)', slug: 'iphone-se-3', releaseYear: 2022, msrp: 4299 },
  { brand: 'apple', category: 'notebook', name: 'MacBook Air M2', slug: 'macbook-air-m2', releaseYear: 2022, msrp: 11999 },
  { brand: 'apple', category: 'notebook', name: 'MacBook Pro 14" M3', slug: 'macbook-pro-14-m3', releaseYear: 2023, msrp: 18999 },
  { brand: 'samsung', category: 'celular', name: 'Galaxy S24', slug: 'galaxy-s24', releaseYear: 2024, msrp: 7499 },
  { brand: 'samsung', category: 'celular', name: 'Galaxy S23 Ultra', slug: 'galaxy-s23-ultra', releaseYear: 2023, msrp: 8999 },
  { brand: 'samsung', category: 'celular', name: 'Galaxy A54', slug: 'galaxy-a54', releaseYear: 2023, msrp: 2699 },
  { brand: 'samsung', category: 'tv', name: 'TV Neo QLED 55" QN90C', slug: 'tv-neo-qled-55-qn90c', releaseYear: 2023, msrp: 6999 },
  { brand: 'xiaomi', category: 'celular', name: 'Redmi Note 13 Pro', slug: 'redmi-note-13-pro', releaseYear: 2024, msrp: 2199 },
  { brand: 'xiaomi', category: 'celular', name: 'Xiaomi 13T', slug: 'xiaomi-13t', releaseYear: 2023, msrp: 3799 },
  { brand: 'motorola', category: 'celular', name: 'Moto G84', slug: 'moto-g84', releaseYear: 2023, msrp: 1899 },
  { brand: 'motorola', category: 'celular', name: 'Moto Edge 40', slug: 'moto-edge-40', releaseYear: 2023, msrp: 2999 },
  { brand: 'dell', category: 'notebook', name: 'XPS 13', slug: 'xps-13', releaseYear: 2023, msrp: 12999 },
  { brand: 'dell', category: 'notebook', name: 'Inspiron 15', slug: 'inspiron-15', releaseYear: 2022, msrp: 4499 },
  { brand: 'lenovo', category: 'notebook', name: 'ThinkPad X1 Carbon', slug: 'thinkpad-x1-carbon', releaseYear: 2023, msrp: 14999 },
  { brand: 'lenovo', category: 'notebook', name: 'IdeaPad 3', slug: 'ideapad-3', releaseYear: 2022, msrp: 3299 },
  { brand: 'sony', category: 'console', name: 'PlayStation 5', slug: 'playstation-5', releaseYear: 2020, msrp: 4499 },
  { brand: 'sony', category: 'console', name: 'PlayStation 5 Slim', slug: 'playstation-5-slim', releaseYear: 2023, msrp: 3999 },
  { brand: 'sony', category: 'camera', name: 'Alpha A7 IV', slug: 'alpha-a7-iv', releaseYear: 2021, msrp: 18999 },
  { brand: 'sony', category: 'tv', name: 'Bravia XR 65" A80L', slug: 'bravia-xr-65-a80l', releaseYear: 2023, msrp: 8999 },
  { brand: 'microsoft', category: 'console', name: 'Xbox Series X', slug: 'xbox-series-x', releaseYear: 2020, msrp: 4199 },
  { brand: 'microsoft', category: 'console', name: 'Xbox Series S', slug: 'xbox-series-s', releaseYear: 2020, msrp: 2199 },
  { brand: 'nintendo', category: 'console', name: 'Switch OLED', slug: 'switch-oled', releaseYear: 2021, msrp: 2799 },
  { brand: 'nintendo', category: 'console', name: 'Switch Lite', slug: 'switch-lite', releaseYear: 2019, msrp: 1699 },
  { brand: 'lg', category: 'tv', name: 'OLED 55" C3', slug: 'oled-55-c3', releaseYear: 2023, msrp: 7999 },
  { brand: 'lg', category: 'tv', name: 'UHD 50" UR8750', slug: 'uhd-50-ur8750', releaseYear: 2023, msrp: 2999 },
  { brand: 'canon', category: 'camera', name: 'EOS R6 Mark II', slug: 'eos-r6-mark-ii', releaseYear: 2022, msrp: 16999 },
  { brand: 'canon', category: 'camera', name: 'EOS Rebel T7', slug: 'eos-rebel-t7', releaseYear: 2018, msrp: 3299 },
  { brand: 'dji', category: 'drone', name: 'Mini 4 Pro', slug: 'mini-4-pro', releaseYear: 2023, msrp: 6499 },
  { brand: 'dji', category: 'drone', name: 'Air 3', slug: 'air-3', releaseYear: 2023, msrp: 8999 },
  { brand: 'bosch', category: 'ferramenta', name: 'Furadeira GSB 550', slug: 'furadeira-gsb-550', releaseYear: 2020, msrp: 399 },
  { brand: 'bosch', category: 'ferramenta', name: 'Parafusadeira GSR 12V', slug: 'parafusadeira-gsr-12v', releaseYear: 2021, msrp: 699 },
  { brand: 'fender', category: 'instrumentos-musicais', name: 'Stratocaster Player', slug: 'stratocaster-player', releaseYear: 2020, msrp: 6999 },
  { brand: 'fender', category: 'instrumentos-musicais', name: 'Telecaster Standard', slug: 'telecaster-standard', releaseYear: 2019, msrp: 6499 },
  { brand: 'honda', category: 'veiculos', name: 'Civic EXL', slug: 'civic-exl', releaseYear: 2021, msrp: 149900 },
  { brand: 'honda', category: 'veiculos', name: 'HR-V EXL', slug: 'hrv-exl', releaseYear: 2022, msrp: 159900 },
  { brand: 'honda', category: 'veiculos', name: 'CG 160 Titan', slug: 'cg-160-titan', releaseYear: 2022, msrp: 15900 },
  { brand: 'samsung', category: 'notebook', name: 'Galaxy Book3', slug: 'galaxy-book3', releaseYear: 2023, msrp: 6999 },
];

// ─── Planos ──────────────────────────────────────────────────────────
const PLANS = [
  {
    name: 'Free', slug: 'free', priceCents: 0, interval: 'month',
    limits: { evaluationsPerMonth: 3, monitors: 1, photosPerEvaluation: 5 },
    features: ['3 avaliações/mês', '1 monitor de preço', 'Até 5 fotos por avaliação'],
  },
  {
    name: 'Pro', slug: 'pro', priceCents: 2990, interval: 'month',
    limits: { evaluationsPerMonth: 30, monitors: 10, photosPerEvaluation: 15 },
    features: ['30 avaliações/mês', '10 monitores de preço', 'Até 15 fotos por avaliação', 'Suporte prioritário'],
  },
  {
    name: 'Business', slug: 'business', priceCents: 9990, interval: 'month',
    limits: { evaluationsPerMonth: -1, monitors: -1, photosPerEvaluation: 15 },
    features: ['Avaliações ilimitadas', 'Monitores ilimitados', 'Até 15 fotos por avaliação', 'API dedicada', 'Suporte prioritário 24/7'],
  },
];

const CITIES: Record<string, string> = {
  SP: 'São Paulo', RJ: 'Rio de Janeiro', MG: 'Belo Horizonte', PR: 'Curitiba', SC: 'Florianópolis',
  RS: 'Porto Alegre', BA: 'Salvador', PE: 'Recife', DF: 'Brasília', GO: 'Goiânia',
};

async function main() {
  console.log('Seed: iniciando...');

  // ── Categorias ──
  const categoryBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        attributesSchema: c.attrs as any,
        defaultAnnualDepreciation: c.depreciation,
      },
      update: {
        name: c.name,
        icon: c.icon,
        attributesSchema: c.attrs as any,
        defaultAnnualDepreciation: c.depreciation,
      },
    });
    categoryBySlug.set(c.slug, cat.id);
  }
  console.log(`  ${CATEGORIES.length} categorias`);

  // ── Marcas ──
  const brandBySlug = new Map<string, string>();
  for (const b of BRANDS) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      create: { name: b.name, slug: b.slug },
      update: { name: b.name },
    });
    brandBySlug.set(b.slug, brand.id);
    for (const catSlug of b.categories) {
      const categoryId = categoryBySlug.get(catSlug);
      if (!categoryId) continue;
      await prisma.brandCategory.upsert({
        where: { brandId_categoryId: { brandId: brand.id, categoryId } },
        create: { brandId: brand.id, categoryId },
        update: {},
      });
    }
  }
  console.log(`  ${BRANDS.length} marcas`);

  // ── Modelos ──
  const modelBySlug = new Map<string, { id: string; msrp: number; releaseYear: number; categorySlug: string; brandSlug: string }>();
  for (const m of MODELS) {
    const brandId = brandBySlug.get(m.brand)!;
    const categoryId = categoryBySlug.get(m.category)!;
    const model = await prisma.model.upsert({
      where: { slug: m.slug },
      create: {
        brandId,
        categoryId,
        name: m.name,
        slug: m.slug,
        releaseYear: m.releaseYear,
        msrp: m.msrp,
        specs: {},
      },
      update: { releaseYear: m.releaseYear, msrp: m.msrp },
    });
    modelBySlug.set(m.slug, { id: model.id, msrp: m.msrp, releaseYear: m.releaseYear, categorySlug: m.category, brandSlug: m.brand });
  }
  console.log(`  ${MODELS.length} modelos`);

  // ── Planos ──
  const planBySlug = new Map<string, string>();
  for (const p of PLANS) {
    const plan = await prisma.plan.upsert({
      where: { slug: p.slug },
      create: p as any,
      update: { priceCents: p.priceCents, limits: p.limits as any, features: p.features as any },
    });
    planBySlug.set(p.slug, plan.id);
  }
  console.log(`  ${PLANS.length} planos`);

  // ── Usuários ──
  const admin = await prisma.user.upsert({
    where: { email: 'admin@priceai.com.br' },
    create: {
      name: 'Administrador PriceAI',
      email: 'admin@priceai.com.br',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
    update: {},
  });

  const demo = await prisma.user.upsert({
    where: { email: 'demo@priceai.com.br' },
    create: {
      name: 'Usuário Demo',
      email: 'demo@priceai.com.br',
      passwordHash: await bcrypt.hash('demo123', 10),
      role: 'USER',
    },
    update: {},
  });

  await prisma.subscription.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      userId: demo.id,
      planId: planBySlug.get('pro')!,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      externalId: 'seed_demo_pro',
    },
    update: {},
  });
  console.log('  Usuários admin e demo prontos');

  // ── price_history (90 dias) para os modelos populares ──
  const popularSlugs = [
    'iphone-15-pro', 'iphone-14', 'galaxy-s24', 'galaxy-s23-ultra', 'playstation-5',
    'switch-oled', 'macbook-air-m2', 'xbox-series-x', 'redmi-note-13-pro', 'moto-g84',
  ];
  for (const slug of popularSlugs) {
    const model = modelBySlug.get(slug);
    if (!model) continue;
    const category = CATEGORIES.find((c) => c.slug === model.categorySlug)!;
    const age = new Date().getFullYear() - model.releaseYear;
    const base = model.msrp * Math.pow(1 - category.depreciation, Math.max(age, 0.5));
    const rng = mulberry32(hashString(`history:${slug}`));
    // tendência leve (alta ou queda) + ruído diário determinístico
    const trendPerDay = randBetween(rng, -0.0015, 0.0008);

    const rows = [];
    for (let i = 89; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dayIndex = 89 - i;
      const trendFactor = 1 + trendPerDay * dayIndex;
      const noise = 1 + randBetween(rng, -0.035, 0.035);
      const median = Math.round(base * trendFactor * noise * 100) / 100;
      const spread = median * randBetween(rng, 0.12, 0.22);
      rows.push({
        modelId: model.id,
        date,
        medianPrice: median,
        avgPrice: Math.round((median + randBetween(rng, -spread * 0.3, spread * 0.3)) * 100) / 100,
        minPrice: Math.round((median - spread) * 100) / 100,
        maxPrice: Math.round((median + spread) * 100) / 100,
        sampleSize: randInt(rng, 12, 45),
        conditionBucket: null,
      });
    }
    await prisma.priceHistory.deleteMany({ where: { modelId: model.id, conditionBucket: null } });
    await prisma.priceHistory.createMany({ data: rows as any, skipDuplicates: true });
  }
  console.log(`  price_history (90 dias) para ${popularSlugs.length} modelos populares`);

  // ── Avaliações completas de exemplo para o usuário demo ──
  const sampleEvaluations = [
    { slug: 'iphone-15-pro', condition: ProductCondition.LIKE_NEW, year: 2023, state: 'SP', hasInvoice: true, hasWarranty: true },
    { slug: 'galaxy-s23-ultra', condition: ProductCondition.GOOD, year: 2023, state: 'RJ', hasInvoice: true, hasWarranty: false },
    { slug: 'playstation-5', condition: ProductCondition.GOOD, year: 2021, state: 'MG', hasInvoice: false, hasWarranty: false },
    { slug: 'macbook-air-m2', condition: ProductCondition.LIKE_NEW, year: 2022, state: 'SP', hasInvoice: true, hasWarranty: true },
    { slug: 'switch-oled', condition: ProductCondition.FAIR, year: 2021, state: 'PR', hasInvoice: false, hasWarranty: false },
    { slug: 'redmi-note-13-pro', condition: ProductCondition.NEW, year: 2024, state: 'BA', hasInvoice: true, hasWarranty: true },
    { slug: 'xbox-series-x', condition: ProductCondition.GOOD, year: 2020, state: 'RS', hasInvoice: false, hasWarranty: false },
    { slug: 'moto-g84', condition: ProductCondition.FAIR, year: 2023, state: 'DF', hasInvoice: false, hasWarranty: false },
  ];

  const marketplaces = ['MERCADO_LIVRE', 'OLX', 'FACEBOOK_MARKETPLACE', 'EBAY', 'AMAZON', 'MAGAZINE_LUIZA'] as const;

  for (const sample of sampleEvaluations) {
    const model = modelBySlug.get(sample.slug);
    if (!model) continue;
    const category = CATEGORIES.find((c) => c.slug === model.categorySlug)!;
    const rng = mulberry32(hashString(`eval:${sample.slug}:${demo.id}`));

    const age = new Date().getFullYear() - model.releaseYear;
    const base = model.msrp * Math.pow(1 - category.depreciation, Math.max(age, 0.5));
    const conditionFactorMap: Record<string, number> = {
      NEW: 0.98, LIKE_NEW: 0.9, GOOD: 0.78, FAIR: 0.62, POOR: 0.45, FOR_PARTS: 0.22,
    };
    const conditionScore: Record<string, number> = {
      NEW: 9.7, LIKE_NEW: 9.1, GOOD: 8.0, FAIR: 6.4, POOR: 4.8, FOR_PARTS: 2.1,
    };
    const recommended = Math.round(base * conditionFactorMap[sample.condition] * 100) / 100;
    const quickSale = Math.round(recommended * 0.88 * 100) / 100;
    const maxPrice = Math.round(recommended * 1.09 * 100) / 100;
    const median = recommended;
    const min = Math.round(median * 0.8 * 100) / 100;
    const max = Math.round(median * 1.25 * 100) / 100;
    const avg = Math.round(((min + max) / 2) * 100) / 100;

    const evaluation = await prisma.evaluation.create({
      data: {
        userId: demo.id,
        modelId: model.id,
        status: 'DONE',
        condition: sample.condition,
        year: sample.year,
        attributes: {},
        hasInvoice: sample.hasInvoice,
        hasWarranty: sample.hasWarranty,
        accessories: sample.hasInvoice ? ['carregador original', 'caixa'] : [],
        locationCity: CITIES[sample.state],
        locationState: sample.state,
        conditionScore: conditionScore[sample.condition],
        recommendedPrice: recommended,
        quickSalePrice: quickSale,
        maxPrice,
        minMarketPrice: min,
        avgMarketPrice: avg,
        medianMarketPrice: median,
        confidence: Math.round(randBetween(rng, 0.72, 0.96) * 100) / 100,
        estimatedDaysToSell: randInt(rng, 4, 25),
      },
    });

    // Fotos fake (3-6)
    const photoCount = randInt(rng, 3, 6);
    for (let i = 0; i < photoCount; i++) {
      await prisma.photo.create({
        data: {
          evaluationId: evaluation.id,
          storageKey: `seed/${sample.slug}/${i}.jpg`,
          url: `https://placehold.co/800x600?text=${encodeURIComponent(sample.slug)}-${i}`,
          order: i,
          score: Math.round(randBetween(rng, conditionScore[sample.condition] - 1, conditionScore[sample.condition]) * 10) / 10,
          analysis: [],
        },
      });
    }

    // Relatório de condição
    await prisma.conditionReport.create({
      data: {
        evaluationId: evaluation.id,
        overallScore: conditionScore[sample.condition],
        summary: `Análise das fotos indica estado ${sample.condition === 'NEW' ? 'de produto novo' : 'compatível com uso declarado'}, nota ${conditionScore[sample.condition].toFixed(1)}/10.`,
        findings: [],
        provider: 'mock',
      },
    });

    // Anúncios de mercado (válidos + alguns excluídos)
    const listingCount = randInt(rng, 10, 18);
    for (let i = 0; i < listingCount; i++) {
      const isExcluded = rng() > 0.8;
      const price = isExcluded
        ? Math.round(median * (rng() > 0.5 ? randBetween(rng, 2.5, 4) : randBetween(rng, 0.15, 0.35)))
        : Math.round(median * randBetween(rng, 0.85, 1.18));
      await prisma.marketPrice.create({
        data: {
          evaluationId: evaluation.id,
          marketplace: pick(rng, marketplaces),
          title: `${sample.slug.replace(/-/g, ' ')} usado`,
          price,
          url: `https://exemplo.com/anuncio-${evaluation.id}-${i}`,
          sellerRating: Math.round(randBetween(rng, 3.5, 5) * 10) / 10,
          conditionLabel: 'Usado',
          isOutlier: isExcluded,
          excludedReason: isExcluded ? 'Preço fora da realidade: outlier estatístico' : null,
        },
      });
    }

    // Ajustes de preço (extrato da engine)
    const stages: Array<{ stage: any; reason: string; factor: number }> = [
      { stage: 'BASE', reason: 'Preço base definido pela mediana de mercado.', factor: 1 },
      { stage: 'AGE', reason: 'Ajuste de idade aplicado conforme ano declarado.', factor: 1 },
      { stage: 'CONDITION', reason: `Nota de condição ${conditionScore[sample.condition].toFixed(1)}/10 aplicada à curva.`, factor: conditionFactorMap[sample.condition] },
      { stage: 'DEMAND', reason: 'Ajuste de demanda dentro do limite de ±8%.', factor: 1.02 },
      { stage: 'REGION', reason: `Fator regional de ${sample.state} aplicado.`, factor: 0.97 },
      { stage: 'HISTORY', reason: 'Suavização de 25% em direção à tendência de 90 dias.', factor: 1 },
    ];
    let running = median;
    for (let order = 0; order < stages.length; order++) {
      const input = running;
      const output = Math.round(input * stages[order].factor * 100) / 100;
      running = output;
      await prisma.priceAdjustment.create({
        data: {
          evaluationId: evaluation.id,
          stage: stages[order].stage,
          order,
          inputPrice: input,
          outputPrice: output,
          factor: stages[order].factor,
          reason: stages[order].reason,
        },
      });
    }
  }
  console.log(`  ${sampleEvaluations.length} avaliações completas de exemplo`);

  // ── Monitores + alertas ──
  const monitorSlugs = ['iphone-15-pro', 'playstation-5', 'macbook-air-m2'];
  const alertTypes = ['PRICE_RISE', 'PRICE_DROP', 'OPPORTUNITY', 'BIG_DISCOUNT'] as const;
  for (const slug of monitorSlugs) {
    const model = modelBySlug.get(slug);
    if (!model) continue;
    const rng = mulberry32(hashString(`monitor:${slug}`));
    const monitor = await prisma.monitor.create({
      data: {
        userId: demo.id,
        modelId: model.id,
        condition: 'GOOD',
        targetPrice: Math.round(model.msrp * 0.55),
        active: true,
        lastCheckedAt: new Date(),
      },
    });
    const old = Math.round(model.msrp * randBetween(rng, 0.5, 0.7));
    const now = Math.round(old * randBetween(rng, 0.85, 1.15));
    await prisma.alert.create({
      data: {
        monitorId: monitor.id,
        type: pick(rng, alertTypes),
        oldPrice: old,
        newPrice: now,
        listingUrl: `https://exemplo.com/anuncio-monitor-${monitor.id}`,
        read: rng() > 0.5,
      },
    });
  }
  console.log(`  ${monitorSlugs.length} monitores com alertas`);

  // ── Notificações ──
  const notifTypes = ['EVALUATION_DONE', 'ALERT', 'SUBSCRIPTION', 'SYSTEM'] as const;
  for (let i = 0; i < 6; i++) {
    const rng = mulberry32(hashString(`notif:${i}`));
    await prisma.notification.create({
      data: {
        userId: demo.id,
        type: pick(rng, notifTypes),
        title: `Notificação de exemplo #${i + 1}`,
        body: 'Conteúdo de exemplo gerado pelo seed para demonstração da plataforma.',
        data: {},
        readAt: rng() > 0.5 ? new Date() : null,
      },
    });
  }
  console.log('  6 notificações de exemplo');

  console.log('Seed: concluído com sucesso.');
  console.log(`  Admin: admin@priceai.com.br / admin123`);
  console.log(`  Demo:  demo@priceai.com.br / demo123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
