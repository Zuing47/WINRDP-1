"use client";

import type { User } from "@/lib/types";

const SESSION_KEY = "priceai.session";

export function persistSession(user: User) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // storage indisponível (SSR/privacidade) — sessão fica só em memória
  }
}

export function readSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // noop
  }
}
