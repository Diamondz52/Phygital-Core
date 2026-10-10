"use client";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div>
        <small>АДМИН-ПАНЕЛЬ</small>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions}
    </header>
  );
}
