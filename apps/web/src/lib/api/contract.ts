import type {
  ActivityPoint,
  AdminStats,
  AdminSubscription,
  AdminUser,
  Alert,
  ApiUsageLog,
  AppNotification,
  AuthResponse,
  Brand,
  Category,
  CreateEvaluationInput,
  CreateMonitorInput,
  DashboardStats,
  Evaluation,
  EvaluationFilters,
  Model,
  Monitor,
  Plan,
  PricePoint,
  SystemStatus,
  Usage,
  User,
} from "@/lib/types";

/** Contrato do client — espelha /api/v1 (ARCHITECTURE.md §8). */
export interface PriceAiApi {
  // auth
  login(email: string, password: string): Promise<AuthResponse>;
  register(name: string, email: string, password: string): Promise<AuthResponse>;
  loginWithGoogle(): Promise<AuthResponse>;
  logout(): Promise<void>;
  me(): Promise<User>;

  // catálogo
  getCategories(): Promise<Category[]>;
  getBrands(categoryId: string): Promise<Brand[]>;
  getModels(brandId: string, search?: string): Promise<Model[]>;

  // dashboard
  getDashboardStats(): Promise<DashboardStats>;
  getDashboardActivity(): Promise<ActivityPoint[]>;

  // avaliações
  createEvaluation(input: CreateEvaluationInput): Promise<{ id: string }>;
  getEvaluation(id: string): Promise<Evaluation>;
  listEvaluations(filters?: EvaluationFilters): Promise<Evaluation[]>;
  getPriceHistory(modelId: string, days?: number): Promise<PricePoint[]>;

  // monitores e alertas
  listMonitors(): Promise<Monitor[]>;
  createMonitor(input: CreateMonitorInput): Promise<Monitor>;
  updateMonitor(id: string, patch: Partial<Monitor>): Promise<Monitor>;
  deleteMonitor(id: string): Promise<void>;
  listAlerts(): Promise<Alert[]>;
  markAlertRead(id: string): Promise<void>;
  markAllAlertsRead(): Promise<void>;

  // notificações
  listNotifications(): Promise<AppNotification[]>;
  markNotificationRead(id: string): Promise<void>;

  // planos
  listPlans(): Promise<Plan[]>;
  getUsage(): Promise<Usage>;

  // admin
  getAdminStats(): Promise<AdminStats>;
  listAdminUsers(search?: string): Promise<AdminUser[]>;
  updateAdminUser(id: string, patch: Partial<AdminUser>): Promise<AdminUser>;
  listAdminSubscriptions(): Promise<AdminSubscription[]>;
  listAdminLogs(): Promise<ApiUsageLog[]>;
  getSystemStatus(): Promise<SystemStatus>;
  clearCache(): Promise<void>;
  adminCreateCategory(input: Pick<Category, "name" | "icon">): Promise<Category>;
  adminUpdateCategory(id: string, patch: Partial<Category>): Promise<Category>;
  adminDeleteCategory(id: string): Promise<void>;
  adminCreateBrand(input: { name: string; categoryIds: string[] }): Promise<Brand>;
  adminUpdateBrand(id: string, patch: Partial<Brand>): Promise<Brand>;
  adminDeleteBrand(id: string): Promise<void>;
  adminCreateModel(input: Omit<Model, "id" | "slug">): Promise<Model>;
  adminUpdateModel(id: string, patch: Partial<Model>): Promise<Model>;
  adminDeleteModel(id: string): Promise<void>;
}
