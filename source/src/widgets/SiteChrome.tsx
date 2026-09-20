"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Languages, LogOut, Mail, MapPin, Menu, Monitor, Moon, Phone, ShieldCheck, Sun, UserRound, X } from "lucide-react";
import { useAuth } from "@/features/auth";
import { CONTACTS } from "@/shared/config";
import { useApp } from "@/shared/providers";

const paths = [[/^\/$/, "home", "/"], [/^\/tournaments/, "tournaments", "/tournaments"], [/^\/teams/, "teams", "/teams"], [/^\/rules/, "rules", "/rules"], [/^\/faq/, "faq", "/faq"], [/^\/contacts/, "contacts", "/contacts"]] as const;

export function Logo() {
  return <Link className="logo" href="/" aria-label="Phygital Core — главная"><span className="logo-mark"/><span>Phygital<br/>Core</span></Link>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, setLanguage, theme, setTheme, notify } = useApp();
  const { user, status, logout } = useAuth();
  const [mobile, setMobile] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const labels = { home:t.home, tournaments:t.tournaments, teams:t.teams, rules:t.rules, faq:t.faq, contacts:t.contacts };
  const nextTheme = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
  const closeMobile = () => setMobile(false);
  const signOut = async () => { await logout(); setUserMenu(false); closeMobile(); notify("Вы вышли из аккаунта"); router.push("/"); };

  return <header className="site-header glass">
    <Logo/>
    <button className="mobile-toggle" onClick={() => setMobile(!mobile)} aria-expanded={mobile} aria-label="Меню">{mobile ? <X/> : <Menu/>}</button>
    <nav className={mobile ? "main-nav open" : "main-nav"}>
      {paths.map(([rx,key,href]) => <Link className={rx.test(pathname) ? "active" : ""} href={href} key={key} onClick={closeMobile}>{labels[key]}</Link>)}
      <div className="mobile-account-links">{status === "loading" ? <span>Проверяем сессию…</span> : user ? <><Link href="/profile" onClick={closeMobile}>Личный кабинет</Link>{user.role === "ADMIN" && <Link href="/admin" onClick={closeMobile}>Админ-панель</Link>}<button onClick={signOut}>Выйти</button></> : <><Link href="/login" onClick={closeMobile}>Войти</Link><Link href="/register" onClick={closeMobile}>Регистрация</Link></>}</div>
    </nav>
    <div className="header-tools">
      <button onClick={() => setLanguage(language === "ru" ? "en" : "ru")} aria-label="Сменить язык"><Languages/><small>{language.toUpperCase()}</small></button>
      <button onClick={() => setTheme(nextTheme)} aria-label={`Тема: ${theme}`}>{theme === "dark" ? <Sun/> : theme === "light" ? <Moon/> : <Monitor/>}</button>
      {status === "loading" ? <span className="header-auth-skeleton"/> : user ? <div className="account-control"><button className="account-button" onClick={() => setUserMenu(value => !value)} aria-expanded={userMenu}><UserRound/><span>{user.firstName}</span><ChevronDown/></button>{userMenu && <div className="user-menu glass"><div className="user-menu-head"><b>{user.firstName} {user.lastName}</b><small>{user.email}</small></div><Link href="/profile" onClick={() => setUserMenu(false)}><UserRound/>Личный кабинет</Link>{user.role === "ADMIN" && <Link href="/admin" onClick={() => setUserMenu(false)}><ShieldCheck/>Админ-панель</Link>}<button onClick={signOut}><LogOut/>Выйти</button></div>}</div> : <div className="guest-actions"><Link href="/login">Войти</Link><Link className="primary" href="/register">Регистрация</Link></div>}
    </div>
  </header>;
}

export function SiteFooter() {
  const { t } = useApp();
  return <footer className="site-footer"><div><Logo/><p>Место, где физический спорт встречается с цифровыми технологиями и командной стратегией.</p><div className="socials"><a href={CONTACTS.telegram} rel="noreferrer">TG</a><a href={CONTACTS.vk} rel="noreferrer">VK</a></div><b>{t.more}</b></div><div><h3>Разделы</h3>{paths.slice(0,5).map(([,key,href]) => <Link href={href} key={key}>{({home:t.home,tournaments:t.tournaments,teams:t.teams,rules:t.rules,faq:t.faq,contacts:t.contacts})[key]}</Link>)}</div><div><h3>Участникам</h3><Link href="/login">Вход</Link><Link href="/register">Регистрация</Link><Link href="/privacy">Политика конфиденциальности</Link><Link href="/faq">Вопросы и ответы</Link></div><div><h3>Контакты</h3><p><MapPin/>{CONTACTS.address}</p><a href={CONTACTS.phoneHref}><Phone/>{CONTACTS.phone}</a><a href={CONTACTS.emailHref}><Mail/>{CONTACTS.email}</a><Link className="secondary" href="/contacts">Связаться с нами →</Link></div><small>© 2026 Phygital Core. Все права защищены. <b>СОЕДИНЯЕМ РЕАЛЬНОСТЬ И ЦИФРОВОЙ МИР ///</b></small></footer>;
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><SiteHeader/><main>{children}</main><SiteFooter/></>;
}
