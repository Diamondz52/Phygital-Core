"use client";

import { type ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
};

export function Button({
  children,
  variant = "secondary",
  className = "",
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`pc-button ${variant} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <LoaderCircle className="button-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function GlowButton(props: ButtonProps) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: ButtonProps) {
  return <Button {...props} variant="secondary" />;
}
