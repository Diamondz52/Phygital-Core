"use client";

import { Button } from "@/shared/ui/Button";
import { type ReactNode } from "react";
import { RefreshCw, Search } from "lucide-react";
export function AdminFilters({
  search,
  setSearch,
  status,
  setStatus,
  onReset,
  extra,
}: {
  search: string;
  setSearch: (value: string) => void;
  status?: string;
  setStatus?: (value: string) => void;
  onReset: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="admin-tools">
      <label>
        <Search />
        <input
          aria-label="Поиск"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск…"
        />
      </label>
      {setStatus && (
        <select
          aria-label="Фильтр статуса"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="ALL">Все статусы</option>
          <option value="NEW">Новые</option>
          <option value="APPROVED">Одобренные</option>
          <option value="REJECTED">Отклонённые</option>
        </select>
      )}
      {extra}
      <Button variant="secondary" className="secondary" onClick={onReset}>
        <RefreshCw /> Сбросить
      </Button>
    </div>
  );
}
