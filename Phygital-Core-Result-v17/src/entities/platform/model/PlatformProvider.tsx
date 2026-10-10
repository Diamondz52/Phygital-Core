"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type User, type authService } from "@/entities/user/@x/platform";
import { platformService } from "../api/platformService";
import { createPlatformActions } from "../api/createPlatformActions";
import { initialState } from "./initialState";
import { type PlatformActions } from "./types";

const PlatformContext = createContext<PlatformActions | null>(null);

export function PlatformProvider({
  children,
  actor: signedInUser,
  accountService,
}: {
  children: ReactNode;
  actor: User | null;
  accountService: typeof authService;
}) {
  const [state, setState] = useState(initialState);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    // Restore one shared document; every screen subscribes to the same committed data.
    let active = true;
    const refresh = () => {
      void platformService
        .getState(initialState)
        .then((saved) => {
          if (active) {
            setState(saved);
            setStorageError("");
          }
        })
        .catch(() => {
          if (active)
            setStorageError(
              "Не удалось загрузить локальные данные. Проверьте доступ к хранилищу и перезагрузите страницу.",
            );
        });
    };
    const unsubscribe = platformService.subscribe(refresh);
    refresh();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    // Registration/profile edits also become searchable players without a page reload.
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<User>).detail;
      if (!detail?.id) return;
      void platformService
        .updateState((previous) => {
          const exists = previous.users.some((item) => item.id === detail.id);
          const users = exists
            ? previous.users.map((item) => (item.id === detail.id ? { ...item, ...detail } : item))
            : [...previous.users, { ...detail, createdAt: new Date().toISOString() }];
          return { ...previous, users };
        }, initialState)
        .then(setState)
        .catch(() => setStorageError("Не удалось сохранить данные пользователя"));
    };
    window.addEventListener("phygital:user-sync", sync);
    return () => window.removeEventListener("phygital:user-sync", sync);
  }, []);

  const actions = useMemo(
    () =>
      createPlatformActions(
        state,
        signedInUser,
        accountService,
        async (change) => {
          const next = await platformService.updateState(change, initialState);
          setState(next);
        },
        setStorageError,
      ),
    [state, signedInUser, accountService],
  );

  return (
    <PlatformContext.Provider value={actions}>
      {storageError && (
        <p className="storage-error" role="alert">
          {storageError}
        </p>
      )}
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatformStore() {
  const value = useContext(PlatformContext);
  if (!value) throw new Error("usePlatformStore requires PlatformProvider");
  return value;
}
