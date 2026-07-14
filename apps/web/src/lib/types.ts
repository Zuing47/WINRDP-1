// ─── Domínio PriceAI — tipos do contrato /api/v1 (ARCHITECTURE.md §3 e §8) ───

export type Role = "USER" | "ADMIN";
export type UserStatus = "ACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  status: UserStatus;
  planSlug: PlanSlug;
  createdAt: string;
}

// ─── Catálogo ───

export interface CategoryAttribute {
  key: string;
  label: string;
  type: "select" | "text";
  options?: string[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string; // nome do ícone lucide
  annualDepreciation: number;
  attributes: CategoryAttribute[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  categoryIds: string[];
}

export interface Model {
  id: string;
  brandId: string;
  categoryId: string;
  name: string;
  slug: string;
  releaseYear: number;
  msrp: number;
}

// ─── Avaliações ───

export type EvaluationStatus =
  | "PENDING"
  | "ANALYZING"
  | "SEARCHING"
  | "PRICING"
  | "DONE"
  | "FAILED";

export type Condition = "NEW" | "EXCELLENT" | "GOOD" | "FAIR" | "POOR";

export type PricingStage =
  | "BASE"
  | "AGE"
  | "CONDITION"
  | "DEMAND"
  | "REGION"
  | "HISTORY";

export interface PriceAdjustment {
  stage: PricingStage;
  order: number;
  inputPrice: number;
  outputPrice: number;
  factor: number;
  reason: string;
}

export type Marketplace =
  | "MERCADO_LIVRE"
  | "OLX"
  | "FACEBOOK_MARKETPLACE"
  | "EBAY"
  | "AMAZON"
  | "MAGAZINE_LUIZA";

export interface MarketListing {
  id: string;
  marketplace: Marketplace;
  title: string;
  price: number;
  url: string;
  sellerRating: number;
  conditionLabel: string;
  excludedReason: string | null;
  collectedAt: string;
}

export interface MarketStats {
  min: number;
  max: number;
  avg: number;
  median: number;
  sampleSize: number;
  excludedCount: number;
}

export interface PhotoFinding {
  type: string;
  severity: number; // 0–1
  location: string;
  confidence: number;
}

export interface EvaluationPhoto {
  id: string;
  url: string;
  order: number;
  findings: PhotoFinding[];
  partialScore: number;
}

export interface ConditionReport {
  overallScore: number; // 0–10
  summary: string;
  provider: string;
}

export interface EvaluationPrices {
  recommended: number;
  quickSale: number;
  max: number;
}

export interface Evaluation {
  id: string;
  userId: string;
  modelId: string;
  modelName: string;
  brandName: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  status: EvaluationStatus;
  condition: Condition;
  year: number;
  attributes: Record<string, string>;
  hasInvoice: boolean;
  hasWarranty: boolean;
  accessories: string[];
  location: { city: string; state: string };
  conditionScore: number | null;
  conditionReport: ConditionReport | null;
  prices: EvaluationPrices | null;
  marketStats: MarketStats | null;
  confidence: number | null; // 0–100
  estimatedDaysToSell: number | null;
  photos: EvaluationPhoto[];
  breakdown: PriceAdjustment[];
  listings: MarketListing[];
  createdAt: string;
}

export interface CreateEvaluationInput {
  modelId: string;
  condition: Condition;
  year: number;
  attributes: Record<string, string>;
  hasInvoice: boolean;
  hasWarranty: boolean;
  accessories: string[];
  location: { city: string; state: string };
  photoCount: number;
}

export interface EvaluationFilters {
  categoryId?: string;
  status?: EvaluationStatus;
  period?: "7d" | "30d" | "90d" | "all";
  search?: string;
}

// ─── Preço histórico ───

export interface PricePoint {
  date: string;
  avg: number;
  min: number;
  max: number;
}

// ─── Monitores e alertas ───

export type AlertType =
  | "PRICE_RISE"
  | "PRICE_DROP"
  | "OPPORTUNITY"
  | "BIG_DISCOUNT";

export interface Monitor {
  id: string;
  modelId: string;
  modelName: string;
  brandName: string;
  condition: Condition;
  targetPrice: number;
  lastPrice: number;
  active: boolean;
  sparkline: number[];
  notifyOn: {
    rise: boolean;
    drop: boolean;
    opportunity: boolean;
    bigDiscount: boolean;
  };
  lastCheckedAt: string;
  createdAt: string;
}

export interface CreateMonitorInput {
  modelId: string;
  condition: Condition;
  targetPrice: number;
  notifyOn: Monitor["notifyOn"];
}

export interface Alert {
  id: string;
  monitorId: string;
  modelName: string;
  type: AlertType;
  oldPrice: number;
  newPrice: number;
  listingUrl: string;
  read: boolean;
  createdAt: string;
}

// ─── Dashboard ───

export interface DashboardStats {
  evaluationsCount: number;
  productsCount: number;
  savingsTotal: number;
  monitorsCount: number;
}

export interface ActivityPoint {
  date: string;
  evaluations: number;
}

// ─── Planos / assinaturas ───

export type PlanSlug = "free" | "pro" | "business";

export interface Plan {
  slug: PlanSlug;
  name: string;
  priceCents: number;
  interval: "month";
  limits: {
    evaluationsPerMonth: number;
    monitors: number;
    photosPerEvaluation: number;
  };
  features: string[];
}

export interface Usage {
  evaluationsUsed: number;
  monitorsUsed: number;
}

// ─── Notificações ───

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

// ─── Admin ───

export interface AdminStats {
  usersTotal: number;
  usersGrowth: number;
  mrrCents: number;
  mrrGrowth: number;
  evaluationsTotal: number;
  evaluationsGrowth: number;
  activeMonitors: number;
  signups: { date: string; count: number }[];
  revenue: { date: string; cents: number }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  planSlug: PlanSlug;
  evaluationsCount: number;
  createdAt: string;
}

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING";

export interface AdminSubscription {
  id: string;
  userName: string;
  userEmail: string;
  planSlug: PlanSlug;
  status: SubscriptionStatus;
  periodStart: string;
  periodEnd: string;
  amountCents: number;
}

export interface ApiUsageLog {
  id: string;
  userEmail: string;
  route: string;
  method: string;
  status: number;
  latencyMs: number;
  createdAt: string;
}

export type ConnectorStatus = "OPERATIONAL" | "DEGRADED" | "DOWN";

export interface SystemConnector {
  name: string;
  kind: "marketplace" | "ai";
  status: ConnectorStatus;
  latencyMs: number;
  successRate: number;
  lastCheckedAt: string;
}

export interface SystemStatus {
  connectors: SystemConnector[];
  cache: { keys: number; hitRate: number; sizeMb: number };
  queues: { name: string; waiting: number; active: number; failed: number }[];
}

// ─── Auth ───

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// ─── Envelope padrão ───

export interface ApiEnvelope<T> {
  data: T;
  meta?: { total?: number; page?: number; pageSize?: number };
}
