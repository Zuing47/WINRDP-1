import type {
  AdminSubscription,
  AdminUser,
  Alert,
  AppNotification,
  Brand,
  Category,
  CreateEvaluationInput,
  CreateMonitorInput,
  Evaluation,
  EvaluationStatus,
  Model,
  Monitor,
  User,
} from "@/lib/types";
import type { PriceAiApi } from "../contract";
import { buildEvaluation, generatePriceHistory, generateSparkline } from "./generators";
import { brands as seedBrands, categories as seedCategories, models as seedModels, plans } from "./seed";
import {
  demoUser,
  seedAdminStats,
  seedAdminSubscriptions,
  seedAdminUsers,
  seedAlerts,
  seedApiLogs,
  seedEvaluations,
  seedMonitors,
  seedNotifications,
  seedSystemStatus,
} from "./store";

// ─── Estado mutável em memória ───

const state = {
  user: { ...demoUser } as User,
  categories: [...seedCategories] as Category[],
  brands: [...seedBrands] as Brand[],
  models: [...seedModels] as Model[],
  evaluations: [...seedEvaluations] as Evaluation[],
  pending: new Map<string, { input: CreateEvaluationInput; startedAt: number }>(),
  monitors: [...seedMonitors] as Monitor[],
  alerts: [...seedAlerts] as Alert[],
  notifications: [...seedNotifications] as AppNotification[],
  adminUsers: [...seedAdminUsers] as AdminUser[],
  adminSubscriptions: [...seedAdminSubscriptions] as AdminSubscription[],
};

let idCounter = 100;
const nextId = (prefix: string) => `${prefix}-${String(++idCounter).padStart(4, "0")}`;

const delay = (ms = 350) => new Promise<void>((res) => setTimeout(res, ms + Math.random() * 200));

// Linha do tempo do pipeline simulado (ms desde o submit)
const PIPELINE: Array<[number, EvaluationStatus]> = [
  [0, "ANALYZING"],
  [3200, "SEARCHING"],
  [6600, "PRICING"],
  [9200, "DONE"],
];

function pipelineStatus(startedAt: number): EvaluationStatus {
  const elapsed = Date.now() - startedAt;
  let status: EvaluationStatus = "PENDING";
  for (const [at, s] of PIPELINE) if (elapsed >= at) status = s;
  return status;
}

function resolvePending(id: string): Evaluation | undefined {
  const pending = state.pending.get(id);
  if (!pending) return undefined;
  const model = state.models.find((m) => m.id === pending.input.modelId);
  if (!model) return undefined;
  const status = pipelineStatus(pending.startedAt);
  const evaluation = buildEvaluation({
    id,
    model,
    condition: pending.input.condition,
    year: pending.input.year,
    attributes: pending.input.attributes,
    hasInvoice: pending.input.hasInvoice,
    hasWarranty: pending.input.hasWarranty,
    accessories: pending.input.accessories,
    location: pending.input.location,
    photoCount: pending.input.photoCount,
    createdAt: new Date(pending.startedAt).toISOString(),
    status,
  });
  if (status !== "DONE") {
    // resultado ainda não disponível
    return {
      ...evaluation,
      conditionScore: status === "ANALYZING" ? null : evaluation.conditionScore,
      conditionReport: status === "ANALYZING" ? null : evaluation.conditionReport,
      prices: null,
      marketStats: ["PRICING"].includes(status) ? evaluation.marketStats : null,
      confidence: null,
      estimatedDaysToSell: null,
      breakdown: [],
      listings: [],
    };
  }
  // finalizada → persiste no histórico
  state.pending.delete(id);
  state.evaluations = [evaluation, ...state.evaluations.filter((e) => e.id !== id)];
  return evaluation;
}

const authError = () => Object.assign(new Error("Não autenticado"), { statusCode: 401 });

export const mockApi: PriceAiApi = {
  // ─── auth ───
  async login(email) {
    await delay(500);
    state.user = { ...demoUser, email: email || demoUser.email };
    return { user: state.user, accessToken: "mock-access-token" };
  },
  async register(name, email) {
    await delay(600);
    state.user = { ...demoUser, name: name || demoUser.name, email: email || demoUser.email };
    return { user: state.user, accessToken: "mock-access-token" };
  },
  async loginWithGoogle() {
    await delay(700);
    state.user = { ...demoUser };
    return { user: state.user, accessToken: "mock-access-token" };
  },
  async logout() {
    await delay(150);
  },
  async me() {
    await delay(200);
    if (!state.user) throw authError();
    return state.user;
  },

  // ─── catálogo ───
  async getCategories() {
    await delay(250);
    return state.categories;
  },
  async getBrands(categoryId) {
    await delay(250);
    if (!categoryId) return [...state.brands];
    return state.brands.filter((b) => b.categoryIds.includes(categoryId));
  },
  async getModels(brandId, search) {
    await delay(250);
    let list = brandId ? state.models.filter((m) => m.brandId === brandId) : [...state.models];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(q));
    }
    return list;
  },

  // ─── dashboard ───
  async getDashboardStats() {
    await delay();
    const done = state.evaluations.filter((e) => e.status === "DONE");
    const savings = done.reduce(
      (sum, e) => sum + (e.prices ? Math.max(0, e.prices.max - e.prices.quickSale) : 0),
      0
    );
    return {
      evaluationsCount: done.length + 14,
      productsCount: new Set(done.map((e) => e.modelId)).size + 6,
      savingsTotal: Math.round(savings * 1.8),
      monitorsCount: state.monitors.filter((m) => m.active).length,
    };
  },
  async getDashboardActivity() {
    await delay();
    const days = 30;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.now() - (days - 1 - i) * 86_400_000);
      const seed = date.getDate() * 7 + date.getMonth();
      return {
        date: date.toISOString().slice(0, 10),
        evaluations: Math.max(0, Math.round(2 + Math.sin(i / 3.2) * 2 + (seed % 5) - 1)),
      };
    });
  },

  // ─── avaliações ───
  async createEvaluation(input) {
    await delay(400);
    const id = nextId("eval");
    state.pending.set(id, { input, startedAt: Date.now() });
    return { id };
  },
  async getEvaluation(id) {
    await delay(300);
    const pending = resolvePending(id);
    if (pending) return pending;
    const found = state.evaluations.find((e) => e.id === id);
    if (!found) throw Object.assign(new Error("Avaliação não encontrada"), { statusCode: 404 });
    return found;
  },
  async listEvaluations(filters) {
    await delay();
    let list = [...state.evaluations];
    if (filters?.categoryId) list = list.filter((e) => e.categoryId === filters.categoryId);
    if (filters?.status) list = list.filter((e) => e.status === filters.status);
    if (filters?.period && filters.period !== "all") {
      const days = { "7d": 7, "30d": 30, "90d": 90 }[filters.period];
      const cutoff = Date.now() - days * 86_400_000;
      list = list.filter((e) => new Date(e.createdAt).getTime() >= cutoff);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (e) => e.modelName.toLowerCase().includes(q) || e.brandName.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getPriceHistory(modelId, days = 90) {
    await delay();
    const model = state.models.find((m) => m.id === modelId);
    if (!model) return [];
    return generatePriceHistory(model, days);
  },

  // ─── monitores ───
  async listMonitors() {
    await delay();
    return [...state.monitors];
  },
  async createMonitor(input: CreateMonitorInput) {
    await delay(400);
    const model = state.models.find((m) => m.id === input.modelId);
    const brand = state.brands.find((b) => b.id === model?.brandId);
    const id = nextId("mon");
    const spark = generateSparkline(id, input.targetPrice * 1.05);
    const monitor: Monitor = {
      id,
      modelId: input.modelId,
      modelName: model?.name ?? "Modelo",
      brandName: brand?.name ?? "",
      condition: input.condition,
      targetPrice: input.targetPrice,
      lastPrice: spark[spark.length - 1],
      active: true,
      sparkline: spark,
      notifyOn: input.notifyOn,
      lastCheckedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    state.monitors = [monitor, ...state.monitors];
    return monitor;
  },
  async updateMonitor(id, patch) {
    await delay(300);
    const idx = state.monitors.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Monitor não encontrado");
    state.monitors[idx] = { ...state.monitors[idx], ...patch };
    return state.monitors[idx];
  },
  async deleteMonitor(id) {
    await delay(300);
    state.monitors = state.monitors.filter((m) => m.id !== id);
  },

  // ─── alertas ───
  async listAlerts() {
    await delay();
    return [...state.alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async markAlertRead(id) {
    await delay(150);
    state.alerts = state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a));
  },
  async markAllAlertsRead() {
    await delay(200);
    state.alerts = state.alerts.map((a) => ({ ...a, read: true }));
  },

  // ─── notificações ───
  async listNotifications() {
    await delay(250);
    return [...state.notifications];
  },
  async markNotificationRead(id) {
    await delay(120);
    state.notifications = state.notifications.map((n) =>
      n.id === id ? { ...n, readAt: new Date().toISOString() } : n
    );
  },

  // ─── planos ───
  async listPlans() {
    await delay(250);
    return plans;
  },
  async getUsage() {
    await delay(250);
    return { evaluationsUsed: 12, monitorsUsed: state.monitors.filter((m) => m.active).length };
  },

  // ─── admin ───
  async getAdminStats() {
    await delay();
    return seedAdminStats;
  },
  async listAdminUsers(search) {
    await delay();
    if (!search) return [...state.adminUsers];
    const q = search.toLowerCase();
    return state.adminUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  },
  async updateAdminUser(id, patch) {
    await delay(300);
    const idx = state.adminUsers.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("Usuário não encontrado");
    state.adminUsers[idx] = { ...state.adminUsers[idx], ...patch };
    return state.adminUsers[idx];
  },
  async listAdminSubscriptions() {
    await delay();
    return [...state.adminSubscriptions];
  },
  async listAdminLogs() {
    await delay();
    return [...seedApiLogs];
  },
  async getSystemStatus() {
    await delay();
    return seedSystemStatus;
  },
  async clearCache() {
    await delay(900);
  },
  async adminCreateCategory(input) {
    await delay(300);
    const cat: Category = {
      id: nextId("cat"),
      slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: input.name,
      icon: input.icon || "Package",
      annualDepreciation: 0.15,
      attributes: [],
    };
    state.categories = [...state.categories, cat];
    return cat;
  },
  async adminUpdateCategory(id, patch) {
    await delay(300);
    const idx = state.categories.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error("Categoria não encontrada");
    state.categories[idx] = { ...state.categories[idx], ...patch };
    return state.categories[idx];
  },
  async adminDeleteCategory(id) {
    await delay(300);
    state.categories = state.categories.filter((c) => c.id !== id);
  },
  async adminCreateBrand(input) {
    await delay(300);
    const brand: Brand = {
      id: nextId("brand"),
      name: input.name,
      slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      categoryIds: input.categoryIds,
    };
    state.brands = [...state.brands, brand];
    return brand;
  },
  async adminUpdateBrand(id, patch) {
    await delay(300);
    const idx = state.brands.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Marca não encontrada");
    state.brands[idx] = { ...state.brands[idx], ...patch };
    return state.brands[idx];
  },
  async adminDeleteBrand(id) {
    await delay(300);
    state.brands = state.brands.filter((b) => b.id !== id);
  },
  async adminCreateModel(input) {
    await delay(300);
    const model: Model = {
      ...input,
      id: nextId("model"),
      slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    };
    state.models = [...state.models, model];
    return model;
  },
  async adminUpdateModel(id, patch) {
    await delay(300);
    const idx = state.models.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error("Modelo não encontrado");
    state.models[idx] = { ...state.models[idx], ...patch };
    return state.models[idx];
  },
  async adminDeleteModel(id) {
    await delay(300);
    state.models = state.models.filter((m) => m.id !== id);
  },
};
