"use client";

import { Button } from "@/shared/ui/Button";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="forbidden">
      <AlertTriangle />
      <p className="eyebrow">ЧТО-ТО ПОШЛО НЕ ТАК</p>
      <h1>Не удалось открыть раздел</h1>
      <p>Ваши локальные данные не потеряны. Попробуйте повторить загрузку.</p>
      <Button variant="primary" className="primary" onClick={reset}>
        Попробовать снова
      </Button>
    </main>
  );
}
