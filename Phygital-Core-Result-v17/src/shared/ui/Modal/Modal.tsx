"use client";

import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { type ButtonProps } from "@/shared/ui/Button";
import { Button } from "@/shared/ui/Button";
export function CloseButton({
  className = "",
  ...props
}: Omit<ButtonProps, "variant" | "children">) {
  return (
    <Button
      {...props}
      type="button"
      variant="ghost"
      className={`modal-close ${className}`}
      aria-label={props["aria-label"] ?? "Закрыть"}
    >
      <X aria-hidden="true" />
    </Button>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="modal-actions">{children}</div>;
}

export function Modal({
  title,
  subtitle,
  children,
  onClose,
  busy = false,
  className = "",
  eyebrow,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
  className?: string;
  eyebrow?: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null),
    titleId = useId(),
    subtitleId = useId(),
    mounted = useSyncExternalStore(
      () => () => {},
      () => true,
      () => false,
    );
  const dismiss = useEffectEvent(() => {
    if (!busy) onClose();
  });
  useEffect(() => {
    if (!mounted) return;
    const previous = document.activeElement as HTMLElement | null,
      body = document.body,
      overflow = body.style.overflow;
    body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
      if (event.key === "Tab" && ref.current) {
        const focusable = [
          ...ref.current.querySelectorAll<HTMLElement>("button,input,select,textarea,a[href]"),
        ].filter(
          (element) =>
            !element.hasAttribute("disabled") &&
            element.tabIndex >= 0 &&
            element.getClientRects().length,
        );
        const first = focusable[0],
          last = focusable.at(-1);
        if (!first || !last) {
          event.preventDefault();
          ref.current.focus({ preventScroll: true });
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    };
    document.addEventListener("keydown", key);
    const frame = requestAnimationFrame(() =>
      ref.current?.querySelector<HTMLElement>("input,button")?.focus({ preventScroll: true }),
    );
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", key);
      body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [mounted]);
  if (!mounted) return null;
  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        className={`modal glass modal-frame ${className}`}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        aria-busy={busy}
        ref={ref}
      >
        <header className="modal-header">
          <CloseButton onClick={onClose} disabled={busy} />
          {eyebrow && <div className="modal-eyebrow">{eyebrow}</div>}
          <h2 id={titleId}>{title}</h2>
          {subtitle && (
            <p id={subtitleId} className="modal-subtitle">
              {subtitle}
            </p>
          )}
        </header>
        <div className="modal-content">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
