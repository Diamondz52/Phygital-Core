"use client";

import { useState } from "react";
import { usePlatformStore } from "@/entities/platform";
import { AdminPageHeader } from "@/shared/ui/SectionHeader";
import { DataTable } from "@/shared/ui/DataTable";

import { Pager } from "@/shared/ui/Pagination";
import { AdminFilters } from "@/features/filter-admin-data";
import { logDateIso } from "@/shared/lib";
export function LogsAdmin() {
  const { state } = usePlatformStore();
  const [search, setSearch] = useState(""),
    [action, setAction] = useState("ALL"),
    [object, setObject] = useState("ALL"),
    [period, setPeriod] = useState(""),
    [page, setPage] = useState(1);
  const filtered = state.logs.filter(
      (item) =>
        (action === "ALL" || item.action === action) &&
        (object === "ALL" || item.entityType === object) &&
        (!period || logDateIso(item.date) === period) &&
        `${item.details} ${item.admin} ${item.entityId}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ),
    pages = Math.max(1, Math.ceil(filtered.length / 7)),
    shown = filtered.slice((page - 1) * 7, page * 7),
    actions = [...new Set(state.logs.map((item) => item.action))],
    objects = [...new Set(state.logs.map((item) => item.entityType))];
  return (
    <>
      <AdminPageHeader title="ЛОГИ" description="Журнал административных действий." />
      <AdminFilters
        search={search}
        setSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onReset={() => {
          setSearch("");
          setAction("ALL");
          setObject("ALL");
          setPeriod("");
          setPage(1);
        }}
        extra={
          <>
            <input
              type="date"
              aria-label="Период"
              value={period}
              onChange={(event) => {
                setPeriod(event.target.value);
                setPage(1);
              }}
            />
            <select
              value={action}
              onChange={(event) => {
                setAction(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Все действия</option>
              {actions.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <select
              value={object}
              onChange={(event) => {
                setObject(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Все объекты</option>
              {objects.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </>
        }
      />
      <DataTable
        headers={["Дата", "Администратор", "Действие", "Объект", "ID объекта", "Детали"]}
        rows={shown.map((item) => [
          item.date,
          item.admin,
          item.action,
          item.entityType,
          item.entityId,
          item.details,
        ])}
      />
      <Pager page={page} pages={pages} onChange={setPage} />
    </>
  );
}
