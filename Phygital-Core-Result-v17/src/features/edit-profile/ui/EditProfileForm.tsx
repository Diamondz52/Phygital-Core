"use client";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/entities/user";
import { useApp } from "@/shared/providers";
import { Button } from "@/shared/ui/Button";
import { Save } from "lucide-react";

// Own the form lifecycle without coupling the action to a particular page.
export function EditProfileForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { user, updateProfile } = useAuth();
  const { notify } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [form, setForm] = useState(() => ({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    telegram: user?.telegram ?? "",
    birthDate: user?.birthDate ?? "",
    bio: user?.bio ?? "",
  }));
  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await updateProfile(form);
      notify("Профиль сохранён");
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить профиль");
    } finally {
      setBusy(false);
    }
  };

  if (!user) return null;
  return (
    <form className="profile-form glass" onSubmit={saveProfile}>
      <p className="eyebrow">НАСТРОЙКИ</p>
      <h2>Личные данные</h2>
      <div className="form-split">
        <label>
          Имя
          <input
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            required
          />
        </label>
        <label>
          Фамилия
          <input
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            required
          />
        </label>
      </div>
      <label>
        Email
        <input value={user.email} disabled />
        <small>Email используется для входа.</small>
      </label>
      <div className="form-split">
        <label>
          Телефон
          <input
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </label>
        <label>
          Telegram
          <input
            value={form.telegram}
            onChange={(event) => setForm({ ...form, telegram: event.target.value })}
          />
        </label>
      </div>
      <label>
        Дата рождения
        <input
          type="date"
          value={form.birthDate}
          onChange={(event) => setForm({ ...form, birthDate: event.target.value })}
        />
      </label>
      <label>
        О себе
        <textarea
          maxLength={300}
          value={form.bio}
          onChange={(event) => setForm({ ...form, bio: event.target.value })}
        />
        <small>{form.bio.length}/300</small>
      </label>
      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <Button variant="secondary" type="button" className="secondary" onClick={() => onCancel()}>
          Отмена
        </Button>
        <Button variant="primary" className="primary" loading={busy}>
          <Save />
          {busy ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
