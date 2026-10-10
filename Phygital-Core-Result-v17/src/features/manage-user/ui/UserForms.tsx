"use client";

import { Button } from "@/shared/ui/Button";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { type User } from "@/entities/user";
import { Modal } from "@/shared/ui/Modal";
import { SecondaryButton } from "@/shared/ui/Button";
import { ActionError } from "@/shared/ui/ActionError";
export function CreateUserModal({
  close,
  save,
  busy,
}: {
  close: () => void;
  save: (payload: { firstName: string; lastName: string; email: string; password: string }) => void;
  busy: boolean;
}) {
  const [firstName, setFirstName] = useState(""),
    [lastName, setLastName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError("Пароль должен содержать не менее 8 символов");
      return;
    }
    setError("");
    save({ firstName, lastName, email, password });
  };
  return (
    <Modal
      title="Добавить пользователя"
      subtitle="Новая учётная запись получит роль «Пользователь»."
      onClose={close}
      busy={busy}
    >
      <form onSubmit={submit}>
        <label>
          <span>
            Имя <b className="required">*</b>
          </span>
          <input
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            required
          />
        </label>
        <label>
          <span>
            Фамилия <b className="required">*</b>
          </span>
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} required />
        </label>
        <label>
          <span>
            Email <b className="required">*</b>
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          <span>
            Пароль <b className="required">*</b>
          </span>
          <input
            type="password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <ActionError message={error} />
        <div className="form-actions">
          <SecondaryButton type="button" onClick={close}>
            Отмена
          </SecondaryButton>
          <Button variant="primary" className="primary" loading={busy}>
            {busy ? "Создание…" : "Добавить пользователя"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function UserEditModal({
  user,
  close,
  save,
  busy,
}: {
  user: User;
  close: () => void;
  save: (patch: Partial<User>) => void;
  busy: boolean;
}) {
  const [form, setForm] = useState({ ...user, bio: user.bio ?? "" });
  const field =
    (key: keyof typeof form) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((value) => ({ ...value, [key]: event.target.value }));
  return (
    <Modal title="Редактирование пользователя" onClose={close} busy={busy}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save(form);
        }}
      >
        <div className="form-grid">
          <label>
            Имя
            <input value={form.firstName} onChange={field("firstName")} required />
          </label>
          <label>
            Фамилия
            <input value={form.lastName} onChange={field("lastName")} required />
          </label>
        </div>
        <label>
          Email
          <input type="email" value={form.email} onChange={field("email")} required />
        </label>
        <div className="form-grid">
          <label>
            Телефон
            <input value={form.phone} onChange={field("phone")} />
          </label>
          <label>
            Telegram
            <input value={form.telegram} onChange={field("telegram")} />
          </label>
        </div>
        <div className="form-grid">
          <label>
            Дата рождения
            <input type="date" value={form.birthDate} onChange={field("birthDate")} />
          </label>
          <label>
            Роль
            <select value={form.role} onChange={field("role")}>
              <option value="USER">Пользователь</option>
              <option value="ADMIN">Администратор</option>
            </select>
          </label>
        </div>
        <label>
          О себе
          <textarea value={form.bio} onChange={field("bio")} maxLength={500} />
        </label>
        <div className="form-actions">
          <SecondaryButton type="button" onClick={close}>
            Отмена
          </SecondaryButton>
          <Button variant="primary" className="primary" loading={busy}>
            {busy ? "Сохранение…" : "Сохранить"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
