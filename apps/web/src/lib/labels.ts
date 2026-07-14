import type {
  AlertType,
  Condition,
  ConnectorStatus,
  EvaluationStatus,
  Marketplace,
  PlanSlug,
  PricingStage,
  SubscriptionStatus,
} from "@/lib/types";

export const conditionLabels: Record<Condition, string> = {
  NEW: "Novo",
  EXCELLENT: "Excelente",
  GOOD: "Bom",
  FAIR: "Regular",
  POOR: "Ruim",
};

export const conditionDescriptions: Record<Condition, string> = {
  NEW: "Lacrado ou sem qualquer sinal de uso",
  EXCELLENT: "Sinais mínimos, funcionamento perfeito",
  GOOD: "Marcas leves de uso, tudo funcionando",
  FAIR: "Desgaste visível, funcional",
  POOR: "Danos evidentes ou defeitos parciais",
};

export const statusLabels: Record<EvaluationStatus, string> = {
  PENDING: "Na fila",
  ANALYZING: "Analisando fotos",
  SEARCHING: "Buscando mercado",
  PRICING: "Calculando preço",
  DONE: "Concluída",
  FAILED: "Falhou",
};

export const marketplaceNames: Record<Marketplace, string> = {
  MERCADO_LIVRE: "Mercado Livre",
  OLX: "OLX",
  FACEBOOK_MARKETPLACE: "Facebook Marketplace",
  EBAY: "eBay",
  AMAZON: "Amazon",
  MAGAZINE_LUIZA: "Magazine Luiza",
};

export const alertTypeLabels: Record<AlertType, string> = {
  PRICE_RISE: "Preço subiu",
  PRICE_DROP: "Preço caiu",
  OPPORTUNITY: "Oportunidade",
  BIG_DISCOUNT: "Grande desconto",
};

export const stageLabels: Record<PricingStage, string> = {
  BASE: "Preço base",
  AGE: "Idade",
  CONDITION: "Condição",
  DEMAND: "Demanda",
  REGION: "Região",
  HISTORY: "Histórico",
};

export const planNames: Record<PlanSlug, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  ACTIVE: "Ativa",
  PAST_DUE: "Em atraso",
  CANCELED: "Cancelada",
  TRIALING: "Em teste",
};

export const connectorStatusLabels: Record<ConnectorStatus, string> = {
  OPERATIONAL: "Operacional",
  DEGRADED: "Degradado",
  DOWN: "Fora do ar",
};
