"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AuthModal } from "../ui/AuthModal";
type AuthMode = "login" | "register";

type AuthModalContextValue = {
  openAuth: (mode?: AuthMode, next?: string) => void;
  closeAuth: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ mode: AuthMode; next?: string } | null>(null);
  const openAuth = useCallback(
    (mode: AuthMode = "login", next?: string) => setState({ mode, next }),
    [],
  );
  const closeAuth = useCallback(() => setState(null), []);
  const value = useMemo(() => ({ openAuth, closeAuth }), [openAuth, closeAuth]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {state && <AuthModal initialMode={state.mode} next={state.next} onClose={closeAuth} />}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const value = useContext(AuthModalContext);
  if (!value) throw new Error("useAuthModal must be used inside AuthModalProvider");
  return value;
}
