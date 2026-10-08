"use client";

import type { ReactNode } from "react";
import { AuthModalProvider, AuthProvider } from "@/features/auth";
import { AdminStoreProvider } from "@/features/admin-management";
import { AppProvider } from "@/shared/providers";

export function AppProviders({ children }: { children: ReactNode }) {
  return <AppProvider><AuthProvider><AdminStoreProvider><AuthModalProvider>{children}</AuthModalProvider></AdminStoreProvider></AuthProvider></AppProvider>;
}
