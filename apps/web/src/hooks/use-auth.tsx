"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { clearSession, persistSession, readSession } from "@/lib/auth";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cached = readSession();
    if (cached) setUser(cached);
    setLoading(false);
  }, []);

  const applyAuth = (nextUser: User) => {
    setUser(nextUser);
    persistSession(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: async (email, password) => {
          const res = await api.login(email, password);
          applyAuth(res.user);
        },
        register: async (name, email, password) => {
          const res = await api.register(name, email, password);
          applyAuth(res.user);
        },
        loginWithGoogle: async () => {
          const res = await api.loginWithGoogle();
          applyAuth(res.user);
        },
        logout: async () => {
          await api.logout();
          clearSession();
          setUser(null);
          router.push("/login");
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
