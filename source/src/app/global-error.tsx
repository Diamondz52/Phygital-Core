"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return <html lang="ru"><body><main className="forbidden"><h1>Критическая ошибка</h1><p>Приложение не смогло восстановить интерфейс.</p><button className="primary" onClick={reset}>Перезапустить</button></main></body></html>;
}
