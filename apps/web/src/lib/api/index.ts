import type { PriceAiApi } from "./contract";
import { httpApi } from "./http";
import { mockApi } from "./mock";

/**
 * Modo demo: default `true` — a UI funciona 100% sem backend.
 * Defina NEXT_PUBLIC_USE_MOCKS=false para consumir a API real.
 */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

export const api: PriceAiApi = USE_MOCKS ? mockApi : httpApi;

export type { PriceAiApi } from "./contract";
export { ApiError } from "./http";
