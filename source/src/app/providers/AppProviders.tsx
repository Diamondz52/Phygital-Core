"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth";
import { AppProvider } from "@/shared/providers";

export function AppProviders({ children }: { children: ReactNode }) {
  return <AppProvider><AuthProvider>{children}</AuthProvider></AppProvider>;
}
