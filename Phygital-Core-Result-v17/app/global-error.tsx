"use client";

import { Button } from "@/shared/ui/Button";
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ru">
      <body>
        <main className="forbidden">
          <h1>Критическая ошибка</h1>
          <p>Приложение не смогло восстановить интерфейс.</p>
          <Button variant="primary" className="primary" onClick={reset}>
            Перезапустить
          </Button>
        </main>
      </body>
    </html>
  );
}
