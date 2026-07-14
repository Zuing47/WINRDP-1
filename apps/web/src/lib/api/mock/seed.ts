import type { Brand, Category, Model, Plan } from "@/lib/types";

// ─── PRNG determinístico (mulberry32) ───

export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rng(seedStr: string): () => number {
  return mulberry32(hashSeed(seedStr));
}

// ─── Catálogo: 10 categorias ───

export const categories: Category[] = [
  {
    id: "cat-smartphones",
    slug: "smartphones",
    name: "Smartphones",
    icon: "Smartphone",
    annualDepreciation: 0.18,
    attributes: [
      { key: "storage", label: "Capacidade", type: "select", options: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"] },
      { key: "color", label: "Cor", type: "select", options: ["Preto", "Branco", "Titânio Natural", "Azul", "Verde", "Rosa"] },
    ],
  },
  {
    id: "cat-notebooks",
    slug: "notebooks",
    name: "Notebooks",
    icon: "Laptop",
    annualDepreciation: 0.16,
    attributes: [
      { key: "ram", label: "Memória RAM", type: "select", options: ["8 GB", "16 GB", "24 GB", "32 GB"] },
      { key: "storage", label: "Armazenamento", type: "select", options: ["256 GB", "512 GB", "1 TB", "2 TB"] },
    ],
  },
  {
    id: "cat-videogames",
    slug: "videogames",
    name: "Videogames",
    icon: "Gamepad2",
    annualDepreciation: 0.12,
    attributes: [
      { key: "edition", label: "Edição", type: "select", options: ["Standard", "Digital", "Edição Especial"] },
      { key: "storage", label: "Armazenamento", type: "select", options: ["512 GB", "825 GB", "1 TB", "2 TB"] },
    ],
  },
  {
    id: "cat-tvs",
    slug: "tvs-audio",
    name: "TVs & Áudio",
    icon: "Tv",
    annualDepreciation: 0.15,
    attributes: [
      { key: "size", label: "Tamanho", type: "select", options: ["43\"", "50\"", "55\"", "65\"", "75\""] },
    ],
  },
  {
    id: "cat-cameras",
    slug: "cameras",
    name: "Câmeras",
    icon: "Camera",
    annualDepreciation: 0.1,
    attributes: [
      { key: "kit", label: "Kit", type: "select", options: ["Somente corpo", "Com lente kit", "Com 2 lentes"] },
    ],
  },
  {
    id: "cat-tablets",
    slug: "tablets",
    name: "Tablets",
    icon: "Tablet",
    annualDepreciation: 0.16,
    attributes: [
      { key: "storage", label: "Capacidade", type: "select", options: ["64 GB", "128 GB", "256 GB", "512 GB"] },
      { key: "connectivity", label: "Conectividade", type: "select", options: ["Wi-Fi", "Wi-Fi + Cellular"] },
    ],
  },
  {
    id: "cat-wearables",
    slug: "wearables",
    name: "Wearables",
    icon: "Watch",
    annualDepreciation: 0.2,
    attributes: [
      { key: "size", label: "Tamanho da caixa", type: "select", options: ["40 mm", "41 mm", "44 mm", "45 mm", "49 mm"] },
    ],
  },
  {
    id: "cat-eletro",
    slug: "eletrodomesticos",
    name: "Eletrodomésticos",
    icon: "Refrigerator",
    annualDepreciation: 0.12,
    attributes: [
      { key: "voltage", label: "Voltagem", type: "select", options: ["110 V", "220 V", "Bivolt"] },
    ],
  },
  {
    id: "cat-bikes",
    slug: "bicicletas",
    name: "Bicicletas",
    icon: "Bike",
    annualDepreciation: 0.14,
    attributes: [
      { key: "frame", label: "Tamanho do quadro", type: "select", options: ["S (15\")", "M (17\")", "L (19\")", "XL (21\")"] },
    ],
  },
  {
    id: "cat-ferramentas",
    slug: "ferramentas",
    name: "Ferramentas",
    icon: "Wrench",
    annualDepreciation: 0.1,
    attributes: [
      { key: "voltage", label: "Voltagem", type: "select", options: ["110 V", "220 V", "Bateria 18 V", "Bateria 20 V"] },
    ],
  },
];

// ─── Marcas ───

const b = (id: string, name: string, categoryIds: string[]): Brand => ({
  id,
  name,
  slug: id.replace("brand-", ""),
  categoryIds,
});

export const brands: Brand[] = [
  b("brand-apple", "Apple", ["cat-smartphones", "cat-notebooks", "cat-tablets", "cat-wearables"]),
  b("brand-samsung", "Samsung", ["cat-smartphones", "cat-tablets", "cat-tvs", "cat-wearables", "cat-eletro"]),
  b("brand-xiaomi", "Xiaomi", ["cat-smartphones", "cat-wearables", "cat-tvs"]),
  b("brand-motorola", "Motorola", ["cat-smartphones"]),
  b("brand-sony", "Sony", ["cat-videogames", "cat-tvs", "cat-cameras"]),
  b("brand-microsoft", "Microsoft", ["cat-videogames", "cat-notebooks"]),
  b("brand-nintendo", "Nintendo", ["cat-videogames"]),
  b("brand-dell", "Dell", ["cat-notebooks"]),
  b("brand-lenovo", "Lenovo", ["cat-notebooks", "cat-tablets"]),
  b("brand-lg", "LG", ["cat-tvs", "cat-eletro"]),
  b("brand-jbl", "JBL", ["cat-tvs"]),
  b("brand-canon", "Canon", ["cat-cameras"]),
  b("brand-gopro", "GoPro", ["cat-cameras"]),
  b("brand-garmin", "Garmin", ["cat-wearables"]),
  b("brand-brastemp", "Brastemp", ["cat-eletro"]),
  b("brand-electrolux", "Electrolux", ["cat-eletro"]),
  b("brand-caloi", "Caloi", ["cat-bikes"]),
  b("brand-sense", "Sense", ["cat-bikes"]),
  b("brand-oggi", "Oggi", ["cat-bikes"]),
  b("brand-bosch", "Bosch", ["cat-ferramentas"]),
  b("brand-makita", "Makita", ["cat-ferramentas"]),
  b("brand-dewalt", "DeWalt", ["cat-ferramentas"]),
];

// ─── Modelos ───

let mi = 0;
const m = (brandId: string, categoryId: string, name: string, releaseYear: number, msrp: number): Model => ({
  id: `model-${String(++mi).padStart(3, "0")}`,
  brandId,
  categoryId,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  releaseYear,
  msrp,
});

export const models: Model[] = [
  // Smartphones
  m("brand-apple", "cat-smartphones", "iPhone 15 Pro", 2023, 9299),
  m("brand-apple", "cat-smartphones", "iPhone 15", 2023, 7299),
  m("brand-apple", "cat-smartphones", "iPhone 14", 2022, 7599),
  m("brand-apple", "cat-smartphones", "iPhone 13", 2021, 6599),
  m("brand-apple", "cat-smartphones", "iPhone 12", 2020, 6999),
  m("brand-apple", "cat-smartphones", "iPhone SE (3ª geração)", 2022, 4199),
  m("brand-samsung", "cat-smartphones", "Galaxy S24", 2024, 5999),
  m("brand-samsung", "cat-smartphones", "Galaxy S24 Ultra", 2024, 9999),
  m("brand-samsung", "cat-smartphones", "Galaxy S23", 2023, 5499),
  m("brand-samsung", "cat-smartphones", "Galaxy A54", 2023, 2499),
  m("brand-samsung", "cat-smartphones", "Galaxy Z Flip 5", 2023, 7999),
  m("brand-xiaomi", "cat-smartphones", "Redmi Note 13 Pro", 2024, 2599),
  m("brand-xiaomi", "cat-smartphones", "Xiaomi 13T", 2023, 4999),
  m("brand-motorola", "cat-smartphones", "Moto Edge 40", 2023, 3299),
  m("brand-motorola", "cat-smartphones", "Moto G84", 2023, 1899),
  // Notebooks
  m("brand-apple", "cat-notebooks", "MacBook Air M2", 2022, 12999),
  m("brand-apple", "cat-notebooks", "MacBook Air M3", 2024, 14999),
  m("brand-apple", "cat-notebooks", "MacBook Pro 14 M3", 2023, 19999),
  m("brand-dell", "cat-notebooks", "XPS 13 Plus", 2023, 13999),
  m("brand-dell", "cat-notebooks", "Inspiron 15 5530", 2023, 4899),
  m("brand-lenovo", "cat-notebooks", "ThinkPad X1 Carbon G11", 2023, 15499),
  m("brand-lenovo", "cat-notebooks", "IdeaPad Slim 5", 2023, 3999),
  m("brand-microsoft", "cat-notebooks", "Surface Laptop 5", 2022, 11999),
  // Videogames
  m("brand-sony", "cat-videogames", "PlayStation 5", 2020, 4499),
  m("brand-sony", "cat-videogames", "PlayStation 5 Slim", 2023, 3999),
  m("brand-sony", "cat-videogames", "PlayStation 4 Pro", 2016, 2999),
  m("brand-microsoft", "cat-videogames", "Xbox Series X", 2020, 4599),
  m("brand-microsoft", "cat-videogames", "Xbox Series S", 2020, 2699),
  m("brand-nintendo", "cat-videogames", "Nintendo Switch OLED", 2021, 2499),
  m("brand-nintendo", "cat-videogames", "Nintendo Switch Lite", 2019, 1599),
  // TVs & Áudio
  m("brand-samsung", "cat-tvs", "Smart TV QLED Q80C 55\"", 2023, 4599),
  m("brand-lg", "cat-tvs", "OLED evo C3 55\"", 2023, 6999),
  m("brand-sony", "cat-tvs", "Bravia XR A80L 55\"", 2023, 8499),
  m("brand-jbl", "cat-tvs", "Soundbar JBL Bar 500", 2022, 2999),
  m("brand-xiaomi", "cat-tvs", "TV Q680 QLED 55\"", 2023, 2799),
  // Câmeras
  m("brand-canon", "cat-cameras", "EOS R50", 2023, 5499),
  m("brand-sony", "cat-cameras", "Alpha A6400", 2019, 6499),
  m("brand-gopro", "cat-cameras", "HERO12 Black", 2023, 3299),
  m("brand-canon", "cat-cameras", "EOS Rebel T7", 2018, 2899),
  // Tablets
  m("brand-apple", "cat-tablets", "iPad Air (5ª geração)", 2022, 5799),
  m("brand-apple", "cat-tablets", "iPad (9ª geração)", 2021, 3199),
  m("brand-apple", "cat-tablets", "iPad Pro 11 M2", 2022, 9499),
  m("brand-samsung", "cat-tablets", "Galaxy Tab S9", 2023, 5999),
  m("brand-lenovo", "cat-tablets", "Tab P11 Pro", 2022, 2999),
  // Wearables
  m("brand-apple", "cat-wearables", "Apple Watch Series 9", 2023, 4299),
  m("brand-apple", "cat-wearables", "Apple Watch Ultra 2", 2023, 8999),
  m("brand-samsung", "cat-wearables", "Galaxy Watch 6", 2023, 2299),
  m("brand-garmin", "cat-wearables", "Forerunner 265", 2023, 3999),
  m("brand-xiaomi", "cat-wearables", "Smart Band 8", 2023, 399),
  // Eletrodomésticos
  m("brand-brastemp", "cat-eletro", "Geladeira Frost Free BRM54", 2022, 3899),
  m("brand-electrolux", "cat-eletro", "Lava e Seca LSE11", 2022, 4299),
  m("brand-lg", "cat-eletro", "Micro-ondas Smart 30L", 2023, 899),
  m("brand-samsung", "cat-eletro", "Lava-louças 14 serviços", 2022, 4599),
  // Bicicletas
  m("brand-caloi", "cat-bikes", "Caloi Elite Carbon Sport", 2022, 12999),
  m("brand-sense", "cat-bikes", "Sense Impact Pro", 2023, 8499),
  m("brand-oggi", "cat-bikes", "Oggi Big Wheel 7.4", 2023, 6999),
  // Ferramentas
  m("brand-bosch", "cat-ferramentas", "Furadeira GSB 550 RE", 2021, 449),
  m("brand-makita", "cat-ferramentas", "Parafusadeira DHP484", 2022, 1899),
  m("brand-dewalt", "cat-ferramentas", "Serra Circular DWE560", 2021, 1099),
];

// ─── Planos ───

export const plans: Plan[] = [
  {
    slug: "free",
    name: "Free",
    priceCents: 0,
    interval: "month",
    limits: { evaluationsPerMonth: 3, monitors: 1, photosPerEvaluation: 5 },
    features: [
      "3 avaliações por mês",
      "1 monitor de preço",
      "Até 5 fotos por avaliação",
      "Busca em 3 marketplaces",
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    priceCents: 2990,
    interval: "month",
    limits: { evaluationsPerMonth: 50, monitors: 10, photosPerEvaluation: 15 },
    features: [
      "50 avaliações por mês",
      "10 monitores de preço",
      "Até 15 fotos por avaliação",
      "Busca em 6 marketplaces",
      "Breakdown completo da engine",
      "Histórico de preço de 90 dias",
      "Alertas em tempo real",
    ],
  },
  {
    slug: "business",
    name: "Business",
    priceCents: 9990,
    interval: "month",
    limits: { evaluationsPerMonth: 500, monitors: 100, photosPerEvaluation: 15 },
    features: [
      "500 avaliações por mês",
      "100 monitores de preço",
      "API de precificação",
      "Certificado de avaliação em PDF",
      "Múltiplos usuários",
      "Suporte prioritário",
      "SLA de 99,9%",
    ],
  },
];

export const accessoriesByCategory: Record<string, string[]> = {
  "cat-smartphones": ["Caixa original", "Carregador", "Cabo original", "Fones", "Película aplicada", "Capinha"],
  "cat-notebooks": ["Caixa original", "Carregador original", "Mochila/case", "Mouse"],
  "cat-videogames": ["Caixa original", "1 controle extra", "Cabos originais", "Jogos físicos"],
  "cat-tvs": ["Controle remoto", "Base/suporte", "Caixa original", "Manual"],
  "cat-cameras": ["Caixa original", "Bateria extra", "Cartão de memória", "Bolsa/case", "Alça original"],
  "cat-tablets": ["Caixa original", "Carregador", "Capa/case", "Caneta (stylus)"],
  "cat-wearables": ["Caixa original", "Carregador", "Pulseira extra"],
  "cat-eletro": ["Nota fiscal de instalação", "Manual", "Acessórios internos completos"],
  "cat-bikes": ["Nota fiscal", "Suporte de caramanhola", "Ciclocomputador", "Pedais extras"],
  "cat-ferramentas": ["Maleta original", "Bateria extra", "Carregador", "Brocas/acessórios"],
};

export const ufs = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const regionFactors: Record<string, number> = {
  SP: 1.0, RJ: 0.99, MG: 0.97, PR: 0.98, SC: 0.99, RS: 0.98, DF: 0.99,
  BA: 0.95, PE: 0.95, CE: 0.94, GO: 0.96, ES: 0.97, AM: 0.93, PA: 0.93,
};
