"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, AtSign, ShieldCheck, UserRound } from "lucide-react";
import { useApp } from "@/shared/providers";
import { useAuth } from "../model/AuthProvider";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const { notify } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (busy) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Введите корректный email");
    if (password.length < 8) return setError("Пароль должен содержать не менее 8 символов");
    setBusy(true);
    try {
      const current = mode === "login"
        ? await login(email, password)
        : await register({ firstName: String(data.get("firstName") || ""), lastName: String(data.get("lastName") || ""), email, password });
      notify(mode === "login" ? "Вход выполнен" : "Аккаунт создан");
      const requested = params.get("next");
      router.replace(requested && requested.startsWith("/") ? requested : current.role === "ADMIN" ? "/admin" : "/profile");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось выполнить вход");
    } finally { setBusy(false); }
  };

  return <section className="auth-stage"><div className="auth-visual"><p className="eyebrow">PHYGITAL ID</p><h1>{mode === "login" ? "Снова в игре" : "Создай свой профиль"}</h1><p>{mode === "login" ? "Управляйте командами, заявками и участием в турнирах из единого кабинета." : "Один аккаунт открывает доступ к командам, турнирам и персональным настройкам."}</p><div className="auth-benefit"><ShieldCheck/><span><b>Локальная защищённая сессия</b><small>Данные сохраняются на этом устройстве</small></span></div></div><div className="auth-card glass"><div><p className="eyebrow">{mode === "login" ? "ВХОД" : "РЕГИСТРАЦИЯ"}</p><h2>{mode === "login" ? "Добро пожаловать" : "Новый участник"}</h2><p>{mode === "login" ? "Введите данные локального аккаунта." : "Заполните четыре поля — остальное можно добавить позже."}</p></div><form onSubmit={submit} aria-busy={busy}>{mode === "register"&&<div className="form-split"><label>Имя<input name="firstName" autoComplete="given-name" minLength={2} required/></label><label>Фамилия<input name="lastName" autoComplete="family-name" minLength={2} required/></label></div>}<label>Email<span className="input-icon"><AtSign/><input name="email" type="email" autoComplete="email" placeholder="name@example.ru" required/></span></label><label>Пароль<span className="input-icon"><UserRound/><input name="password" type={visible?"text":"password"} autoComplete={mode==="login"?"current-password":"new-password"} placeholder="Минимум 8 символов" required/><button type="button" onClick={()=>setVisible(value=>!value)}>{visible?"Скрыть":"Показать"}</button></span></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="primary auth-submit" type="submit" disabled={busy}>{busy?"Проверяем…":mode==="login"?"Войти":"Создать аккаунт"}<ArrowRight/></button></form>{mode === "login"&&<div className="demo-accounts"><b>Демо-доступ</b><button type="button" onClick={()=>{const form=document.querySelector<HTMLFormElement>(".auth-card form");if(!form)return;(form.elements.namedItem("email")as HTMLInputElement).value="user@phygital.local";(form.elements.namedItem("password")as HTMLInputElement).value="User123!"}}>Пользователь</button><button type="button" onClick={()=>{const form=document.querySelector<HTMLFormElement>(".auth-card form");if(!form)return;(form.elements.namedItem("email")as HTMLInputElement).value="admin@phygital.local";(form.elements.namedItem("password")as HTMLInputElement).value="Admin123!"}}>Администратор</button></div>}<p className="auth-switch">{mode==="login"?"Нет аккаунта?":"Уже есть аккаунт?"} <Link href={mode==="login"?"/register":"/login"}>{mode==="login"?"Зарегистрироваться":"Войти"}</Link></p></div></section>;
}
