"use client";

import { Button } from "@/shared/ui/Button";
import { useState } from "react";
import { Eye, PenLine, Plus, Trash2 } from "lucide-react";
import { type User } from "@/entities/user";
import { usePlatformStore } from "@/entities/platform";
import { AdminPageHeader } from "@/shared/ui/SectionHeader";
import { Badge } from "@/shared/ui/Badge";
import { DataTable } from "@/shared/ui/DataTable";
import { GlowButton, SecondaryButton } from "@/shared/ui/Button";

import { useAction } from "@/shared/hooks";
import { ActionError } from "@/shared/ui/ActionError";
import { Pager } from "@/shared/ui/Pagination";
import { Confirm } from "@/shared/ui/ConfirmDialog";
import { AdminFilters } from "@/features/filter-admin-data";
import { CreateUserModal } from "@/features/manage-user";
import { UserEditModal } from "@/features/manage-user";
export function UsersAdmin() {
  const { state, createUser, updateUser, resetPassword, deleteUser } = usePlatformStore(),
    { busy, error, run } = useAction();
  const [search, setSearch] = useState(""),
    [role, setRole] = useState("ALL"),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<User | null>(null),
    [editing, setEditing] = useState(false),
    [creating, setCreating] = useState(false),
    [confirm, setConfirm] = useState<"password" | "delete" | null>(null);
  const filtered = state.users.filter(
      (user) =>
        `${user.firstName} ${user.lastName} ${user.email}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (role === "ALL" || user.role === role),
    ),
    pages = Math.max(1, Math.ceil(filtered.length / 5)),
    shown = filtered.slice((page - 1) * 5, page * 5);
  return (
    <>
      <AdminPageHeader
        title="ПОЛЬЗОВАТЕЛИ"
        description="Поиск, профиль и управление доступом."
        actions={
          <GlowButton onClick={() => setCreating(true)}>
            <Plus /> Добавить пользователя
          </GlowButton>
        }
      />
      <AdminFilters
        search={search}
        setSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onReset={() => {
          setSearch("");
          setRole("ALL");
          setPage(1);
        }}
        extra={
          <select
            aria-label="Фильтр роли"
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Все роли</option>
            <option value="USER">Пользователь</option>
            <option value="ADMIN">Администратор</option>
          </select>
        }
      />
      <DataTable
        headers={["Пользователь", "Email", "Телефон", "Telegram", "Роль", "Действия"]}
        rows={shown.map((user) => [
          `${user.firstName} ${user.lastName}`,
          user.email,
          user.phone || "—",
          user.telegram || "—",
          <Badge key="r">{user.role === "ADMIN" ? "Администратор" : "Пользователь"}</Badge>,
          <button
            className="icon-button"
            aria-label="Просмотреть"
            key="a"
            onClick={() => setSelected(user)}
          >
            <Eye />
          </button>,
        ])}
      />
      <Pager page={page} pages={pages} onChange={setPage} />
      {selected && (
        <aside className="side-panel glass">
          <button onClick={() => setSelected(null)} aria-label="Закрыть">
            ×
          </button>
          <h2>Пользователь</h2>
          <h3>
            {selected.firstName} {selected.lastName}
          </h3>
          <p>{selected.email}</p>
          <p>{selected.phone || "Телефон не указан"}</p>
          <ActionError message={error} />
          <GlowButton onClick={() => setEditing(true)}>
            <PenLine /> Редактировать
          </GlowButton>
          <SecondaryButton disabled={Boolean(busy)} onClick={() => setConfirm("password")}>
            Сменить пароль
          </SecondaryButton>
          <Button variant="danger" className="danger" onClick={() => setConfirm("delete")}>
            <Trash2 /> Удалить пользователя
          </Button>
        </aside>
      )}
      {creating && (
        <CreateUserModal
          busy={busy === "create-user"}
          close={() => setCreating(false)}
          save={(payload) =>
            void run("create-user", () => createUser(payload), "Пользователь создан").then((ok) => {
              if (ok) setCreating(false);
            })
          }
        />
      )}
      {editing && selected && (
        <UserEditModal
          user={selected}
          busy={busy === "edit"}
          close={() => setEditing(false)}
          save={(patch) =>
            void run("edit", () => updateUser(selected.id, patch), "Данные сохранены").then(
              (ok) => {
                if (!ok) return;
                setSelected({ ...selected, ...patch });
                setEditing(false);
              },
            )
          }
        />
      )}
      {confirm && selected && (
        <Confirm
          title={confirm === "password" ? "Сбросить пароль пользователя?" : "Удалить пользователя?"}
          text={
            confirm === "password"
              ? "Пароль пользователя будет заменён на 12345678."
              : "Пользователь будет удалён без возможности восстановления."
          }
          confirmLabel={confirm === "password" ? "Сбросить пароль" : "Удалить пользователя"}
          close={() => setConfirm(null)}
          confirm={() =>
            void run(
              confirm,
              () => (confirm === "password" ? resetPassword(selected.id) : deleteUser(selected.id)),
              confirm === "password" ? "Пароль успешно сброшен." : "Пользователь удалён",
            ).then((ok) => {
              if (!ok) return;
              setConfirm(null);
              if (confirm === "delete") setSelected(null);
            })
          }
          busy={busy === confirm}
        />
      )}
    </>
  );
}
