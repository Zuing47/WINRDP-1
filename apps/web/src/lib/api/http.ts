import type { ApiEnvelope, AuthResponse } from "@/lib/types";
import type { PriceAiApi } from "./contract";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

// Access token mantido em memória (refresh via cookie httpOnly).
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public error?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      const body = (await res.json()) as ApiEnvelope<AuthResponse>;
      accessToken = body.data.accessToken;
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retry = true
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Interceptor de refresh: 401 → tenta renovar o access token uma vez.
  if (res.status === 401 && retry && !path.startsWith("/auth/")) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(method, path, body, false);
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      payload?.message ?? `Erro ${res.status}`,
      payload?.error
    );
  }
  if (res.status === 204) return undefined as T;
  const payload = (await res.json()) as ApiEnvelope<T> | T;
  return payload && typeof payload === "object" && "data" in payload
    ? (payload as ApiEnvelope<T>).data
    : (payload as T);
}

const qs = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") search.set(k, String(v));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
};

export const httpApi: PriceAiApi = {
  async login(email, password) {
    const auth = await request<AuthResponse>("POST", "/auth/login", { email, password });
    accessToken = auth.accessToken;
    return auth;
  },
  async register(name, email, password) {
    const auth = await request<AuthResponse>("POST", "/auth/register", { name, email, password });
    accessToken = auth.accessToken;
    return auth;
  },
  async loginWithGoogle() {
    const auth = await request<AuthResponse>("POST", "/auth/google", {});
    accessToken = auth.accessToken;
    return auth;
  },
  async logout() {
    await request<void>("POST", "/auth/logout", {});
    accessToken = null;
  },
  me: () => request("GET", "/auth/me"),

  getCategories: () => request("GET", "/catalog/categories"),
  getBrands: (categoryId) => request("GET", `/catalog/brands${qs({ categoryId })}`),
  getModels: (brandId, search) => request("GET", `/catalog/models${qs({ brandId, search })}`),

  getDashboardStats: () => request("GET", "/dashboard/stats"),
  getDashboardActivity: () => request("GET", "/dashboard/activity"),

  async createEvaluation(input) {
    const created = await request<{ id: string }>("POST", "/evaluations", input);
    await request("POST", `/evaluations/${created.id}/submit`, {});
    return created;
  },
  getEvaluation: (id) => request("GET", `/evaluations/${id}`),
  listEvaluations: (filters) =>
    request(
      "GET",
      `/evaluations${qs({
        categoryId: filters?.categoryId,
        status: filters?.status,
        period: filters?.period,
        search: filters?.search,
      })}`
    ),
  getPriceHistory: (modelId, days = 90) =>
    request("GET", `/models/${modelId}/price-history${qs({ days })}`),

  listMonitors: () => request("GET", "/monitors"),
  createMonitor: (input) => request("POST", "/monitors", input),
  updateMonitor: (id, patch) => request("PATCH", `/monitors/${id}`, patch),
  deleteMonitor: (id) => request("DELETE", `/monitors/${id}`),
  listAlerts: () => request("GET", "/alerts"),
  markAlertRead: (id) => request("PATCH", `/alerts/${id}/read`, {}),
  markAllAlertsRead: () => request("PATCH", "/alerts/read-all", {}),

  listNotifications: () => request("GET", "/notifications"),
  markNotificationRead: (id) => request("PATCH", `/notifications/${id}/read`, {}),

  listPlans: () => request("GET", "/plans"),
  getUsage: () => request("GET", "/subscriptions/usage"),

  getAdminStats: () => request("GET", "/admin/stats"),
  listAdminUsers: (search) => request("GET", `/admin/users${qs({ search })}`),
  updateAdminUser: (id, patch) => request("PATCH", `/admin/users/${id}`, patch),
  listAdminSubscriptions: () => request("GET", "/admin/subscriptions"),
  listAdminLogs: () => request("GET", "/admin/logs"),
  getSystemStatus: () => request("GET", "/admin/system"),
  clearCache: () => request("POST", "/admin/system/cache/clear", {}),
  adminCreateCategory: (input) => request("POST", "/admin/catalog/categories", input),
  adminUpdateCategory: (id, patch) => request("PATCH", `/admin/catalog/categories/${id}`, patch),
  adminDeleteCategory: (id) => request("DELETE", `/admin/catalog/categories/${id}`),
  adminCreateBrand: (input) => request("POST", "/admin/catalog/brands", input),
  adminUpdateBrand: (id, patch) => request("PATCH", `/admin/catalog/brands/${id}`, patch),
  adminDeleteBrand: (id) => request("DELETE", `/admin/catalog/brands/${id}`),
  adminCreateModel: (input) => request("POST", "/admin/catalog/models", input),
  adminUpdateModel: (id, patch) => request("PATCH", `/admin/catalog/models/${id}`, patch),
  adminDeleteModel: (id) => request("DELETE", `/admin/catalog/models/${id}`),
};
