import type {
  AdminStats,
  AdminSubscription,
  AdminUser,
  Alert,
  ApiUsageLog,
  AppNotification,
  Condition,
  Evaluation,
  Monitor,
  SystemStatus,
  User,
} from "@/lib/types";
import { buildEvaluation, generateSparkline } from "./generators";
import { models, rng } from "./seed";

const daysAgo = (d: number, h = 0) =>
  new Date(Date.now() - d * 86_400_000 - h * 3_600_000).toISOString();

export const demoUser: User = {
  id: "user-demo",
  name: "Mateus Andrade",
  email: "mateus@headoversea.com",
  avatarUrl: null,
  role: "ADMIN",
  status: "ACTIVE",
  planSlug: "pro",
  createdAt: daysAgo(210),
};

const model = (name: string) => {
  const found = models.find((m) => m.name === name);
  if (!found) throw new Error(`Modelo seed não encontrado: ${name}`);
  return found;
};

// ─── Avaliações seed (10) ───

const seedSpecs: Array<{
  name: string;
  condition: Condition;
  year: number;
  attributes: Record<string, string>;
  invoice: boolean;
  warranty: boolean;
  accessories: string[];
  city: string;
  state: string;
  photos: number;
  daysAgo: number;
}> = [
  { name: "iPhone 15 Pro", condition: "EXCELLENT", year: 2023, attributes: { storage: "256 GB", color: "Titânio Natural" }, invoice: true, warranty: true, accessories: ["Caixa original", "Cabo original"], city: "São Paulo", state: "SP", photos: 10, daysAgo: 1 },
  { name: "Galaxy S24", condition: "GOOD", year: 2024, attributes: { storage: "256 GB", color: "Preto" }, invoice: true, warranty: false, accessories: ["Caixa original", "Carregador"], city: "Curitiba", state: "PR", photos: 8, daysAgo: 3 },
  { name: "PlayStation 5", condition: "GOOD", year: 2021, attributes: { edition: "Standard", storage: "825 GB" }, invoice: false, warranty: false, accessories: ["1 controle extra", "Cabos originais"], city: "Belo Horizonte", state: "MG", photos: 7, daysAgo: 6 },
  { name: "MacBook Air M2", condition: "EXCELLENT", year: 2022, attributes: { ram: "16 GB", storage: "512 GB" }, invoice: true, warranty: false, accessories: ["Caixa original", "Carregador original"], city: "São Paulo", state: "SP", photos: 12, daysAgo: 9 },
  { name: "iPhone 13", condition: "FAIR", year: 2021, attributes: { storage: "128 GB", color: "Azul" }, invoice: false, warranty: false, accessories: [], city: "Salvador", state: "BA", photos: 6, daysAgo: 14 },
  { name: "Nintendo Switch OLED", condition: "EXCELLENT", year: 2022, attributes: { edition: "Standard", storage: "512 GB" }, invoice: true, warranty: false, accessories: ["Caixa original", "Jogos físicos"], city: "Florianópolis", state: "SC", photos: 9, daysAgo: 19 },
  { name: "Apple Watch Series 9", condition: "GOOD", year: 2023, attributes: { size: "45 mm" }, invoice: false, warranty: true, accessories: ["Caixa original", "Pulseira extra"], city: "Rio de Janeiro", state: "RJ", photos: 5, daysAgo: 25 },
  { name: "OLED evo C3 55\"", condition: "EXCELLENT", year: 2023, attributes: { size: "55\"" }, invoice: true, warranty: true, accessories: ["Controle remoto", "Base/suporte"], city: "Campinas", state: "SP", photos: 6, daysAgo: 31 },
  { name: "Galaxy S24", condition: "EXCELLENT", year: 2024, attributes: { storage: "256 GB", color: "Preto" }, invoice: true, warranty: true, accessories: ["Caixa original", "Carregador", "Cabo original"], city: "Curitiba", state: "PR", photos: 11, daysAgo: 38 },
  { name: "EOS R50", condition: "GOOD", year: 2023, attributes: { kit: "Com lente kit" }, invoice: true, warranty: false, accessories: ["Bateria extra", "Bolsa/case"], city: "Porto Alegre", state: "RS", photos: 8, daysAgo: 47 },
];

export const seedEvaluations: Evaluation[] = seedSpecs.map((s, i) =>
  buildEvaluation({
    id: `eval-${String(i + 1).padStart(3, "0")}`,
    model: model(s.name),
    condition: s.condition,
    year: s.year,
    attributes: s.attributes,
    hasInvoice: s.invoice,
    hasWarranty: s.warranty,
    accessories: s.accessories,
    location: { city: s.city, state: s.state },
    photoCount: s.photos,
    createdAt: daysAgo(s.daysAgo, 4),
  })
);

// ─── Monitores ───

const monitorSeed = (
  id: string,
  name: string,
  condition: Condition,
  target: number,
  created: number
): Monitor => {
  const mdl = model(name);
  const spark = generateSparkline(id, target * 1.06);
  return {
    id,
    modelId: mdl.id,
    modelName: mdl.name,
    brandName: mdl.brandId.replace("brand-", "").replace(/^./, (c) => c.toUpperCase()),
    condition,
    targetPrice: target,
    lastPrice: spark[spark.length - 1],
    active: id !== "mon-004",
    sparkline: spark,
    notifyOn: { rise: false, drop: true, opportunity: true, bigDiscount: true },
    lastCheckedAt: daysAgo(0, 2),
    createdAt: daysAgo(created),
  };
};

export const seedMonitors: Monitor[] = [
  monitorSeed("mon-001", "iPhone 15 Pro", "EXCELLENT", 6200, 40),
  monitorSeed("mon-002", "PlayStation 5", "GOOD", 2800, 32),
  monitorSeed("mon-003", "MacBook Air M2", "EXCELLENT", 7500, 21),
  monitorSeed("mon-004", "Galaxy S24", "GOOD", 3400, 12),
];

// ─── Alertas ───

export const seedAlerts: Alert[] = [
  { id: "alr-001", monitorId: "mon-001", modelName: "iPhone 15 Pro", type: "PRICE_DROP", oldPrice: 6790, newPrice: 6390, listingUrl: "#", read: false, createdAt: daysAgo(0, 3) },
  { id: "alr-002", monitorId: "mon-002", modelName: "PlayStation 5", type: "OPPORTUNITY", oldPrice: 3100, newPrice: 2650, listingUrl: "#", read: false, createdAt: daysAgo(0, 9) },
  { id: "alr-003", monitorId: "mon-003", modelName: "MacBook Air M2", type: "BIG_DISCOUNT", oldPrice: 8900, newPrice: 7190, listingUrl: "#", read: false, createdAt: daysAgo(1, 5) },
  { id: "alr-004", monitorId: "mon-001", modelName: "iPhone 15 Pro", type: "PRICE_RISE", oldPrice: 6390, newPrice: 6620, listingUrl: "#", read: true, createdAt: daysAgo(2, 7) },
  { id: "alr-005", monitorId: "mon-004", modelName: "Galaxy S24", type: "PRICE_DROP", oldPrice: 3690, newPrice: 3480, listingUrl: "#", read: true, createdAt: daysAgo(4) },
  { id: "alr-006", monitorId: "mon-002", modelName: "PlayStation 5", type: "PRICE_DROP", oldPrice: 3250, newPrice: 3100, listingUrl: "#", read: true, createdAt: daysAgo(6) },
];

// ─── Notificações ───

export const seedNotifications: AppNotification[] = [
  { id: "ntf-001", type: "alert", title: "Queda de preço: iPhone 15 Pro", body: "O preço médio caiu para R$ 6.390 — abaixo do seu alvo.", readAt: null, createdAt: daysAgo(0, 3) },
  { id: "ntf-002", type: "evaluation", title: "Avaliação concluída", body: "Seu iPhone 15 Pro foi avaliado em R$ 6.540.", readAt: null, createdAt: daysAgo(1) },
  { id: "ntf-003", type: "alert", title: "Oportunidade: PlayStation 5", body: "Anúncio 15% abaixo da mediana de mercado detectado na OLX.", readAt: null, createdAt: daysAgo(1, 6) },
  { id: "ntf-004", type: "billing", title: "Fatura paga", body: "Sua assinatura Pro foi renovada com sucesso.", readAt: daysAgo(3), createdAt: daysAgo(3) },
];

// ─── Admin ───

const r = rng("admin");

export const seedAdminStats: AdminStats = {
  usersTotal: 12847,
  usersGrowth: 8.4,
  mrrCents: 18432000,
  mrrGrowth: 12.1,
  evaluationsTotal: 94210,
  evaluationsGrowth: 15.3,
  activeMonitors: 21390,
  signups: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
    count: Math.round(95 + i * 2.4 + (r() - 0.5) * 40),
  })),
  revenue: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
    cents: Math.round((520000 + i * 9500 + (r() - 0.5) * 120000)),
  })),
};

const adminNames = [
  ["Mateus Andrade", "mateus@headoversea.com", "ADMIN", "pro"],
  ["Ana Beatriz Souza", "ana.souza@gmail.com", "USER", "pro"],
  ["Carlos Eduardo Lima", "carlos.lima@outlook.com", "USER", "free"],
  ["Fernanda Oliveira", "fe.oliveira@gmail.com", "USER", "business"],
  ["João Pedro Santos", "jp.santos@gmail.com", "USER", "free"],
  ["Mariana Costa", "mari.costa@uol.com.br", "USER", "pro"],
  ["Rafael Almeida", "rafa.almeida@gmail.com", "USER", "free"],
  ["Juliana Ferreira", "ju.ferreira@hotmail.com", "USER", "pro"],
  ["Bruno Rodrigues", "bruno.rod@gmail.com", "USER", "free"],
  ["Camila Martins", "camila.martins@gmail.com", "USER", "business"],
  ["Lucas Pereira", "lucas.pereira@gmail.com", "USER", "free"],
  ["Patrícia Gomes", "patricia.gomes@terra.com.br", "USER", "pro"],
] as const;

export const seedAdminUsers: AdminUser[] = adminNames.map(([name, email, role, plan], i) => ({
  id: `usr-${String(i + 1).padStart(3, "0")}`,
  name,
  email,
  role: role as AdminUser["role"],
  status: i === 8 ? "SUSPENDED" : "ACTIVE",
  planSlug: plan as AdminUser["planSlug"],
  evaluationsCount: Math.round(r() * 120),
  createdAt: daysAgo(Math.round(r() * 300) + 5),
}));

export const seedAdminSubscriptions: AdminSubscription[] = seedAdminUsers
  .filter((u) => u.planSlug !== "free")
  .map((u, i) => ({
    id: `sub-${String(i + 1).padStart(3, "0")}`,
    userName: u.name,
    userEmail: u.email,
    planSlug: u.planSlug,
    status: i === 3 ? "PAST_DUE" : i === 5 ? "TRIALING" : "ACTIVE",
    periodStart: daysAgo(18),
    periodEnd: new Date(Date.now() + 12 * 86_400_000).toISOString(),
    amountCents: u.planSlug === "business" ? 9990 : 2990,
  }));

const routes = [
  ["POST", "/api/v1/evaluations", 201],
  ["GET", "/api/v1/evaluations/:id", 200],
  ["GET", "/api/v1/catalog/models", 200],
  ["GET", "/api/v1/dashboard/stats", 200],
  ["POST", "/api/v1/monitors", 201],
  ["GET", "/api/v1/alerts", 200],
  ["POST", "/api/v1/auth/login", 200],
  ["GET", "/api/v1/models/:id/price-history", 200],
  ["POST", "/api/v1/evaluations/:id/submit", 202],
  ["GET", "/api/v1/admin/stats", 200],
  ["POST", "/api/v1/auth/refresh", 401],
  ["GET", "/api/v1/evaluations", 200],
] as const;

export const seedApiLogs: ApiUsageLog[] = Array.from({ length: 40 }, (_, i) => {
  const [method, route, status] = routes[Math.floor(r() * routes.length)];
  const user = seedAdminUsers[Math.floor(r() * seedAdminUsers.length)];
  return {
    id: `log-${String(i + 1).padStart(3, "0")}`,
    userEmail: user.email,
    route,
    method,
    status: r() > 0.93 ? 429 : status,
    latencyMs: Math.round(18 + r() * 480),
    createdAt: daysAgo(0, i * 0.6),
  };
});

export const seedSystemStatus: SystemStatus = {
  connectors: [
    { name: "Mercado Livre", kind: "marketplace", status: "OPERATIONAL", latencyMs: 320, successRate: 99.2, lastCheckedAt: daysAgo(0, 0.1) },
    { name: "OLX", kind: "marketplace", status: "OPERATIONAL", latencyMs: 410, successRate: 98.7, lastCheckedAt: daysAgo(0, 0.1) },
    { name: "Facebook Marketplace", kind: "marketplace", status: "DEGRADED", latencyMs: 1840, successRate: 91.4, lastCheckedAt: daysAgo(0, 0.1) },
    { name: "eBay", kind: "marketplace", status: "OPERATIONAL", latencyMs: 520, successRate: 99.6, lastCheckedAt: daysAgo(0, 0.1) },
    { name: "Amazon", kind: "marketplace", status: "OPERATIONAL", latencyMs: 380, successRate: 99.1, lastCheckedAt: daysAgo(0, 0.1) },
    { name: "Magazine Luiza", kind: "marketplace", status: "DOWN", latencyMs: 0, successRate: 0, lastCheckedAt: daysAgo(0, 0.1) },
    { name: "Claude (Anthropic)", kind: "ai", status: "OPERATIONAL", latencyMs: 2100, successRate: 99.8, lastCheckedAt: daysAgo(0, 0.1) },
    { name: "OpenAI GPT-4o", kind: "ai", status: "OPERATIONAL", latencyMs: 2600, successRate: 99.4, lastCheckedAt: daysAgo(0, 0.1) },
    { name: "Gemini", kind: "ai", status: "DEGRADED", latencyMs: 4900, successRate: 94.2, lastCheckedAt: daysAgo(0, 0.1) },
    { name: "Ollama (local)", kind: "ai", status: "OPERATIONAL", latencyMs: 6200, successRate: 100, lastCheckedAt: daysAgo(0, 0.1) },
  ],
  cache: { keys: 12483, hitRate: 87.3, sizeMb: 412 },
  queues: [
    { name: "market-search", waiting: 12, active: 4, failed: 1 },
    { name: "photo-analysis", waiting: 7, active: 2, failed: 0 },
    { name: "price-monitor", waiting: 214, active: 8, failed: 3 },
    { name: "notifications", waiting: 0, active: 1, failed: 0 },
  ],
};
