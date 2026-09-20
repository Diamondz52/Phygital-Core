"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useAuth } from "../model/AuthProvider";

export function ProtectedGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => { if (status === "guest") router.replace(`/login?next=${encodeURIComponent(pathname)}`); }, [status, router, pathname]);
  if (status !== "authenticated") return <GateState loading={status === "loading"} />;
  return children;
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => { if (status === "guest") router.replace(`/login?next=${encodeURIComponent(pathname)}`); }, [status, router, pathname]);
  if (status !== "authenticated") return <GateState loading={status === "loading"} />;
  if (user?.role !== "ADMIN") return <main className="forbidden"><LockKeyhole/><p className="eyebrow">ДОСТУП ОГРАНИЧЕН</p><h1>403</h1><p>Эта зона доступна только администраторам платформы.</p><Link className="primary" href="/profile">Вернуться в кабинет</Link></main>;
  return children;
}

function GateState({ loading }: { loading: boolean }) {
  return <main className="forbidden auth-loading"><LoaderCircle className="spin"/><h1>{loading ? "Проверяем сессию" : "Переходим ко входу"}</h1><p>Это займёт несколько секунд.</p></main>;
}
