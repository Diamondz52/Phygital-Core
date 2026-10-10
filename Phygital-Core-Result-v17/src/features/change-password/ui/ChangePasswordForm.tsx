"use client";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/entities/user";
import { useApp } from "@/shared/providers";
import { Button } from "@/shared/ui/Button";

// Own the form lifecycle without coupling the action to a particular page.
export function ChangePasswordForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { user, changePassword } = useAuth();
  const { notify } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const savePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const formElement = event.currentTarget,
      data = new FormData(formElement),
      current = String(data.get("current") || ""),
      next = String(data.get("next") || ""),
      repeat = String(data.get("repeat") || "");
    setError("");
    if (next.length < 8) {
      setError("Новый пароль должен содержать не менее 8 символов");
      return;
    }
    if (next !== repeat) {
      setError("Пароли не совпадают");
      return;
    }
    setBusy(true);
    try {
      await changePassword(current, next);
      formElement.reset();
      notify("Пароль изменён");
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось изменить пароль");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;
  return (
    <form className="profile-form glass" onSubmit={savePassword}>
      <p className="eyebrow">БЕЗОПАСНОСТЬ</p>
      <h2>Изменение пароля</h2>
      <label>
        Текущий пароль
        <input name="current" type="password" autoComplete="current-password" required />
      </label>
      <div className="form-split">
        <label>
          Новый пароль
          <input name="next" type="password" minLength={8} required />
        </label>
        <label>
          Повторите пароль
          <input name="repeat" type="password" minLength={8} required />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <Button variant="secondary" type="button" className="secondary" onClick={() => onCancel()}>
          Отмена
        </Button>
        <Button variant="primary" className="primary" loading={busy}>
          {busy ? "Сохраняем…" : "Изменить пароль"}
        </Button>
      </div>
    </form>
  );
}
