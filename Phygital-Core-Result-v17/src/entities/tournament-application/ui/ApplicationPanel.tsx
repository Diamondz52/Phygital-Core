"use client";

import { Button } from "@/shared/ui/Button";
import { type ReactNode } from "react";
import { GlowButton } from "@/shared/ui/Button";
export function ApplicationPanel({
  title,
  body,
  close,
  approve,
  reject,
  busy,
}: {
  title: string;
  body: ReactNode;
  close: () => void;
  approve: () => void;
  reject: () => void;
  busy: boolean;
}) {
  return (
    <aside className="side-panel glass">
      <button onClick={close} aria-label="Закрыть">
        ×
      </button>
      <h2>{title}</h2>
      {body}
      <div className="form-actions">
        <GlowButton onClick={approve} disabled={busy}>
          Одобрить
        </GlowButton>
        <Button variant="danger" className="danger" onClick={reject} disabled={busy}>
          Отклонить
        </Button>
      </div>
    </aside>
  );
}
