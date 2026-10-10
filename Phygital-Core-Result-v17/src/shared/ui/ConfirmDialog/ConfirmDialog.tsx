"use client";

import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { SecondaryButton } from "@/shared/ui/Button";
export function Confirm({
  title,
  text,
  close,
  confirm,
  busy,
  confirmLabel = "Подтвердить",
}: {
  title: string;
  text: string;
  close: () => void;
  confirm: () => void;
  busy: boolean;
  confirmLabel?: string;
}) {
  return (
    <Modal title={title} subtitle={text} onClose={close} busy={busy}>
      <div className="form-actions">
        <SecondaryButton onClick={close} disabled={busy}>
          Отмена
        </SecondaryButton>
        <Button variant="danger" className="danger" onClick={confirm} disabled={busy}>
          {busy ? "Выполнение…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
