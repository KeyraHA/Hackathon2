import { createContext, useContext, useEffect, useState } from "react";
import type { Operator } from "../types/api";
import { apiFetch } from "../lib/api";

interface AuthContextValue {
  operator: Operator | null;
  login: (teamCode: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [operator, setOperator] = useState<Operator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("token");
    if (!saved) { setLoading(false); return; }

    apiFetch<Operator>("/auth/me")
      .then(setOperator)
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(teamCode: string, email: string, password: string) {
    const res = await apiFetch<{ token: string; operator: Operator }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ teamCode, email, password }),
    });
    localStorage.setItem("token", res.token);
    setOperator(res.operator);
  }

  function logout() {
    localStorage.removeItem("token");
    setOperator(null);
  }

  return (
    <AuthContext.Provider value={{ operator, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}