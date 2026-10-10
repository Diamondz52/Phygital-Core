"use client";

import { useState, type FormEvent } from "react";
import { Button, SecondaryButton } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
export function CreateTeamModal({
  close,
  create,
}: {
  close: () => void;
  create: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await create(name);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось создать команду");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Создание команды"
      subtitle="Сначала создайте команду — затем приглашайте игроков из базы пользователей."
      onClose={close}
      busy={busy}
    >
      <form onSubmit={submit}>
        <label>
          Название команды <b className="required">*</b>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
            placeholder="Например, Neon Pulse"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <SecondaryButton type="button" onClick={close} disabled={busy}>
            Отмена
          </SecondaryButton>
          <Button variant="primary" className="primary" loading={busy}>
            {busy ? "Создание…" : "Создать команду"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
