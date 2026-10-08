"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authService } from "../api/authService";
import type { AuthUser, ProfilePatch, RegisterPayload } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  status: "loading" | "authenticated" | "guest";
  login(email: string, password: string): Promise<AuthUser>;
  register(payload: RegisterPayload): Promise<AuthUser>;
  logout(): Promise<void>;
  updateProfile(patch: ProfilePatch): Promise<AuthUser>;
  changePassword(currentPassword: string, nextPassword: string): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    let active = true;
    void authService.getCurrentUser().then(current => {
      if (!active) return;
      setUser(current);
      setStatus(current ? "authenticated" : "guest");
    }).catch(()=>{if(active){setUser(null);setStatus("guest")}});
    return () => { active = false; };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    status,
    async login(email, password) {
      const current = await authService.login(email, password);
      setUser(current); setStatus("authenticated"); return current;
    },
    async register(payload) {
      const current = await authService.register(payload);
      setUser(current); setStatus("authenticated"); return current;
    },
    async logout() { await authService.logout(); setUser(null); setStatus("guest"); },
    async updateProfile(patch) {
      if (!user) throw new Error("Требуется авторизация");
      const updated = await authService.updateProfile(user.id, patch);
      setUser(updated); return updated;
    },
    async changePassword(currentPassword, nextPassword) {
      if (!user) throw new Error("Требуется авторизация");
      await authService.changePassword(user.id, currentPassword, nextPassword);
    },
  }), [status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth requires AuthProvider");
  return value;
}
