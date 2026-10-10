"use client";

import { Button } from "@/shared/ui/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useAuth } from "@/entities/user";
import { useAuthModal } from "../model/AuthModalProvider";
export function ProtectedGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const { openAuth } = useAuthModal();
  const pathname = usePathname() ?? "/profile";
  const wasAuthenticated = useRef(false);
  useEffect(() => {
    if (status === "authenticated") wasAuthenticated.current = true;
    if (status === "guest" && !wasAuthenticated.current) openAuth("login", pathname);
  }, [status, openAuth, pathname]);
  if (status !== "authenticated")
    return <GateState loading={status === "loading"} onLogin={() => openAuth("login", pathname)} />;
  return children;
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const { openAuth } = useAuthModal();
  const pathname = usePathname() ?? "/admin";
  useEffect(() => {
    if (status === "guest") openAuth("login", pathname);
  }, [status, openAuth, pathname]);
  if (status !== "authenticated")
    return <GateState loading={status === "loading"} onLogin={() => openAuth("login", pathname)} />;
  if (user?.role !== "ADMIN")
    return (
      <main className="forbidden">
        <LockKeyhole />
        <p className="eyebrow">ДОСТУП ОГРАНИЧЕН</p>
        <h1>403</h1>
        <p>Эта зона доступна только администраторам платформы.</p>
        <Link className="primary" href="/profile">
          Вернуться в кабинет
        </Link>
      </main>
    );
  return children;
}

function GateState({ loading, onLogin }: { loading: boolean; onLogin: () => void }) {
  return (
    <main className="forbidden auth-loading">
      <LoaderCircle className="spin" />
      <h1>{loading ? "Проверяем сессию" : "Требуется вход"}</h1>
      <p>
        {loading ? "Это займёт несколько секунд." : "Авторизуйтесь, чтобы открыть этот раздел."}
      </p>
      {!loading && (
        <Button variant="primary" className="primary" onClick={onLogin}>
          Войти
        </Button>
      )}
    </main>
  );
}
