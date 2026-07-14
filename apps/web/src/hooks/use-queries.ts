"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { EvaluationFilters } from "@/lib/types";

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => api.getCategories() });
}

export function useBrands(categoryId?: string) {
  return useQuery({
    queryKey: ["brands", categoryId],
    queryFn: () => api.getBrands(categoryId as string),
    enabled: Boolean(categoryId),
  });
}

export function useModels(brandId?: string, search?: string) {
  return useQuery({
    queryKey: ["models", brandId, search],
    queryFn: () => api.getModels(brandId as string, search),
    enabled: Boolean(brandId),
  });
}

export function useDashboardStats() {
  return useQuery({ queryKey: ["dashboard", "stats"], queryFn: () => api.getDashboardStats() });
}

export function useDashboardActivity() {
  return useQuery({ queryKey: ["dashboard", "activity"], queryFn: () => api.getDashboardActivity() });
}

export function useEvaluations(filters?: EvaluationFilters) {
  return useQuery({
    queryKey: ["evaluations", filters],
    queryFn: () => api.listEvaluations(filters),
  });
}

export function useEvaluation(id: string, opts?: { poll?: boolean }) {
  return useQuery({
    queryKey: ["evaluation", id],
    queryFn: () => api.getEvaluation(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      if (!opts?.poll) return false;
      const status = query.state.data?.status;
      return status && !["DONE", "FAILED"].includes(status) ? 1200 : false;
    },
  });
}

export function usePriceHistory(modelId?: string, days = 90) {
  return useQuery({
    queryKey: ["price-history", modelId, days],
    queryFn: () => api.getPriceHistory(modelId as string, days),
    enabled: Boolean(modelId),
  });
}

export function useMonitors() {
  return useQuery({ queryKey: ["monitors"], queryFn: () => api.listMonitors() });
}

export function useAlerts() {
  return useQuery({ queryKey: ["alerts"], queryFn: () => api.listAlerts() });
}

export function useNotifications() {
  return useQuery({ queryKey: ["notifications"], queryFn: () => api.listNotifications() });
}

export function usePlans() {
  return useQuery({ queryKey: ["plans"], queryFn: () => api.listPlans() });
}

export function useUsage() {
  return useQuery({ queryKey: ["usage"], queryFn: () => api.getUsage() });
}
