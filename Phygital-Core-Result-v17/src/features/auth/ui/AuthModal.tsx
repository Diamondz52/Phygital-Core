"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { useApp } from "@/shared/providers";
import { useAuth } from "@/entities/user";
export function AuthModal({
  initialMode,
  next,
  onClose,
}: {
  initialMode: "login" | "register";
  next?: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  const { login, register } = useAuth();
  const { notify } = useApp();
  const router = useRouter();

  const switchMode = (value: "login" | "register") => {
    setError("");
    setVisible(false);
    setMode(value);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const confirmation = String(data.get("confirmation") || "");
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Введите корректный email");
    if (password.length < 8) return setError("Пароль должен содержать не менее 8 символов");
    if (mode === "register" && password !== confirmation) return setError("Пароли не совпадают");
    setBusy(true);
    try {
      const current =
        mode === "login"
          ? await login(email, password)
          : await register({
              firstName: String(data.get("firstName") || "").trim(),
              lastName: String(data.get("lastName") || "").trim(),
              email,
              password,
            });
      notify(mode === "login" ? "Вход выполнен" : "Аккаунт создан");
      onClose();
      router.push(
        next && next.startsWith("/") ? next : current.role === "ADMIN" ? "/admin" : "/profile",
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось выполнить действие");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={mode === "login" ? "Вход в Phygital Core" : "Создать аккаунт"}
      subtitle={
        mode === "login"
          ? "Продолжите путь своей команды."
          : "Присоединяйтесь к фиджитал-сообществу."
      }
      onClose={onClose}
      busy={busy}
    >
      <div className="auth-modal-view" key={mode}>
        <form onSubmit={submit} aria-busy={busy}>
          {mode === "register" && (
            <div className="form-split">
              <label>
                <span>
                  Имя <b className="required">*</b>
                </span>
                <input name="firstName" autoComplete="given-name" minLength={2} required />
              </label>
              <label>
                <span>
                  Фамилия <b className="required">*</b>
                </span>
                <input name="lastName" autoComplete="family-name" minLength={2} required />
              </label>
            </div>
          )}
          <label>
            <span>
              Email <b className="required">*</b>
            </span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.ru"
              required
            />
          </label>
          <label>
            <span>
              Пароль <b className="required">*</b>
            </span>
            <span className="password-control">
              <input
                name="password"
                type={visible ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
              >
                {visible ? <EyeOff /> : <Eye />}
              </button>
            </span>
          </label>
          {mode === "register" && (
            <label>
              <span>
                Подтвердите пароль <b className="required">*</b>
              </span>
              <input
                name="confirmation"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>
          )}
          {mode === "login" && (
            <label className="auth-remember">
              <input name="remember" type="checkbox" /> <span>Запомнить меня</span>
            </label>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <Button variant="primary" className="auth-modal-submit" loading={busy} type="submit">
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
            <ArrowRight />
          </Button>
        </form>
        <p className="auth-modal-switch">
          {mode === "login" ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
          <button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Зарегистрироваться" : "Войти"}
          </button>
        </p>
      </div>
    </Modal>
  );
}
