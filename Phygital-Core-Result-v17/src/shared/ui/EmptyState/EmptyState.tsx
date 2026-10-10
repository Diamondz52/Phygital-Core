"use client";

export function EmptyState({ title = "Данных пока нет" }: { title?: string }) {
  return (
    <div className="state glass">
      <h3>{title}</h3>
      <p>Попробуйте обновить страницу позднее.</p>
    </div>
  );
}
