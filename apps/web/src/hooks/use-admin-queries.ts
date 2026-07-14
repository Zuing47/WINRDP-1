"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAdminStats() {
  return useQuery({ queryKey: ["admin", "stats"], queryFn: () => api.getAdminStats() });
}

export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => api.listAdminUsers(search),
  });
}

export function useAdminSubscriptions() {
  return useQuery({ queryKey: ["admin", "subscriptions"], queryFn: () => api.listAdminSubscriptions() });
}

export function useAdminLogs() {
  return useQuery({ queryKey: ["admin", "logs"], queryFn: () => api.listAdminLogs() });
}

export function useSystemStatus() {
  return useQuery({ queryKey: ["admin", "system"], queryFn: () => api.getSystemStatus() });
}

export function useAllBrands() {
  return useQuery({ queryKey: ["admin", "brands", "all"], queryFn: () => api.getBrands() });
}

export function useAllModels() {
  return useQuery({ queryKey: ["admin", "models", "all"], queryFn: () => api.getModels() });
}
