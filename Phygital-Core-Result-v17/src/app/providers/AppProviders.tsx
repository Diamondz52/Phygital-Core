"use client";

import { type ReactNode } from "react";
import { AuthModalProvider } from "@/features/auth";
import { AuthProvider, useAuth, authService } from "@/entities/user";
import { PlatformProvider } from "@/entities/platform";
import { AppProvider } from "@/shared/providers";
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <AuthProvider>
        <PlatformComposition>{children}</PlatformComposition>
      </AuthProvider>
    </AppProvider>
  );
}
// App composes session and platform providers without entity-to-feature imports.
function PlatformComposition({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <PlatformProvider actor={user} accountService={authService}>
      <AuthModalProvider>{children}</AuthModalProvider>
    </PlatformProvider>
  );
}
