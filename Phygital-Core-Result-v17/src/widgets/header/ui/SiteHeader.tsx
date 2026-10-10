"use client";

import { Button } from "@/shared/ui/Button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useAuth } from "@/entities/user";
import { useAuthModal } from "@/features/auth";
import { useApp } from "@/shared/providers";

import { paths } from "@/shared/config";
import { Logo } from "@/shared/ui/Logo";
export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { t, notify } = useApp();
  const { user, status, logout } = useAuth();
  const { openAuth } = useAuthModal();
  const [mobile, setMobile] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const labels = {
    home: t.home,
    tournaments: t.tournaments,
    teams: t.teams,
    rules: t.rules,
    faq: t.faq,
    contacts: t.contacts,
  };
  const closeMobile = () => setMobile(false);
  const signOut = async () => {
    await logout();
    setUserMenu(false);
    closeMobile();
    notify("Вы вышли из аккаунта");
    router.push("/");
  };

  return (
    <header className="site-header site-header-overlay glass">
      <Logo />
      <button
        className="mobile-toggle"
        onClick={() => setMobile(!mobile)}
        aria-expanded={mobile}
        aria-label="Меню"
      >
        {mobile ? <X /> : <Menu />}
      </button>
      <nav className={mobile ? "main-nav open" : "main-nav"}>
        {paths.map(([rx, key, href]) => (
          <Link
            className={rx.test(pathname) ? "active" : ""}
            href={href}
            key={key}
            onClick={closeMobile}
          >
            {labels[key]}
          </Link>
        ))}
        <div className="mobile-account-links">
          {status === "loading" ? (
            <span>Проверяем сессию…</span>
          ) : user ? (
            <>
              <Link href="/profile" onClick={closeMobile}>
                Личный кабинет
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" onClick={closeMobile}>
                  Админ-панель
                </Link>
              )}
              <button onClick={signOut}>Выйти</button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  closeMobile();
                  openAuth("login");
                }}
              >
                Войти
              </button>
              <button
                onClick={() => {
                  closeMobile();
                  openAuth("register");
                }}
              >
                Регистрация
              </button>
            </>
          )}
        </div>
      </nav>
      <div className="header-tools">
        {status === "loading" ? (
          <span className="header-auth-skeleton" />
        ) : user ? (
          <div className="account-control">
            <button
              className="account-button"
              onClick={() => setUserMenu((value) => !value)}
              aria-expanded={userMenu}
            >
              <UserRound />
              <span>{user.firstName}</span>
              <ChevronDown />
            </button>
            {userMenu && (
              <div className="user-menu glass">
                <div className="user-menu-head">
                  <b>
                    {user.firstName} {user.lastName}
                  </b>
                  <small>{user.email}</small>
                </div>
                <Link href="/profile" onClick={() => setUserMenu(false)}>
                  <UserRound />
                  Личный кабинет
                </Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" onClick={() => setUserMenu(false)}>
                    <ShieldCheck />
                    Админ-панель
                  </Link>
                )}
                <button onClick={signOut}>
                  <LogOut />
                  Выйти
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="guest-actions">
            <button onClick={() => openAuth("login")}>Войти</button>
            <Button variant="primary" className="primary" onClick={() => openAuth("register")}>
              Регистрация
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
