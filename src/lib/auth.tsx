import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, apiPost, setAccessToken } from "./api";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string | null;
  avatarUrl?: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  permissions: string[];
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthUser>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  setSession: (accessToken: string, user: AuthUser) => void;
  refreshUser: () => Promise<AuthUser | null>;
  hasPermission: (p: string) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setSession = (token: string, next: AuthUser) => {
    setAccessToken(token);
    setUser(next);
  };

  useEffect(() => {
    api<{ accessToken: string; user: AuthUser }>("/auth/refresh", { method: "POST", skipAuth: true, silent: true })
      .then(async (data) => {
        setAccessToken(data.accessToken);
        const me = await api<{ user: AuthUser }>("/auth/me", { silent: true });
        setUser(me.user);
      })
      .catch(() => {
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      setSession,
      refreshUser: async () => {
        const me = await api<{ user: AuthUser }>("/auth/me", { silent: true });
        setUser(me.user);
        return me.user;
      },
      hasPermission: (p) => Boolean(user?.permissions?.includes(p)),
      login: async (email, password, rememberMe = false) => {
        const data = await apiPost<{ accessToken: string; user: AuthUser }>("/auth/login", {
          email,
          password,
          rememberMe,
        });
        setSession(data.accessToken, data.user);
        return data.user;
      },
      logout: async () => {
        try {
          await apiPost("/auth/logout", {});
        } finally {
          setAccessToken(null);
          setUser(null);
        }
      },
      logoutAll: async () => {
        try {
          await apiPost("/auth/logout-all", {});
        } finally {
          setAccessToken(null);
          setUser(null);
        }
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export type AuthContinueSearch = { redirect?: string; category?: string };

export function parseAuthContinueSearch(s: Record<string, unknown>): AuthContinueSearch {
  const redirect =
    typeof s.redirect === "string" && s.redirect.startsWith("/") && !s.redirect.startsWith("//")
      ? s.redirect
      : undefined;
  const category = typeof s.category === "string" && s.category.length > 0 && s.category.length < 80 ? s.category : undefined;
  return { ...(redirect ? { redirect } : {}), ...(category ? { category } : {}) };
}
