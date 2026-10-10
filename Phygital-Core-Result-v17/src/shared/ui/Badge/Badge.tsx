"use client";

import { type ReactNode } from "react";
export function Badge({
  children,
  tone = "purple",
}: {
  children: ReactNode;
  tone?: "purple" | "green" | "blue" | "red";
}) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
