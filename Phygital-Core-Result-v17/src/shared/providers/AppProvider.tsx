"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { dictionary, type Language } from "@/shared/i18n";
import { storageService } from "@/shared/storage/browserStorage";
type Theme = "dark" | "light" | "system";

type AppState = {
  language: Language;
  setLanguage: (v: Language) => void;
  theme: Theme;
  setTheme: (v: Theme) => void;
  t: Record<keyof typeof dictionary.ru, string>;
  toast: string;
  notify: (v: string) => void;
};

const Context = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ru"),
    [theme, setThemeState] = useState<Theme>("dark"),
    [toast, setToast] = useState("");
  useEffect(() => {
    queueMicrotask(() => {
      // Browser preferences must not break hydration when storage is disabled.
      try {
        const lang = storageService.get("pc-language"),
          the = storageService.get("pc-theme");
        if (lang === "ru" || lang === "en") setLanguageState(lang);
        if (the === "dark" || the === "light" || the === "system") setThemeState(the);
      } catch {
        /* Keep the safe defaults in private/restricted browser sessions. */
      }
    });
  }, []);
  useEffect(() => {
    const actual =
      theme === "system"
        ? matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark"
        : theme;
    document.documentElement.dataset.theme = actual;
  }, [theme]);
  const setLanguage = (v: Language) => {
      setLanguageState(v);
      try {
        storageService.set("pc-language", v);
      } catch {
        setToast("Ошибка: не удалось сохранить язык");
      }
    },
    setTheme = (v: Theme) => {
      setThemeState(v);
      try {
        storageService.set("pc-theme", v);
      } catch {
        setToast("Ошибка: не удалось сохранить тему");
      }
    },
    notify = (v: string) => {
      setToast(v);
      window.setTimeout(() => setToast(""), 2600);
    };
  const value = useMemo(
    () => ({ language, setLanguage, theme, setTheme, t: dictionary[language], toast, notify }),
    [language, theme, toast],
  );
  return (
    <Context.Provider value={value}>
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast.startsWith("Ошибка:") ? "⚠" : "✓"} {toast}
        </div>
      )}
    </Context.Provider>
  );
}

export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("useApp requires AppProvider");
  return value;
}
