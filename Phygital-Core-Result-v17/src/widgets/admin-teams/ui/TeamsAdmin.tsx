"use client";

import { Button } from "@/shared/ui/Button";
import { useState } from "react";
import { Check, Eye, PenLine, Plus, Trash2, UserMinus } from "lucide-react";
import { type Team } from "@/entities/team";
import { TeamBuilderModal } from "@/features/create-team";
import { usePlatformStore } from "@/entities/platform";
import { AdminPageHeader } from "@/shared/ui/SectionHeader";
import { Badge } from "@/shared/ui/Badge";
import { DataTable } from "@/shared/ui/DataTable";
import { GlowButton, SecondaryButton } from "@/shared/ui/Button";

import { useAction } from "@/shared/hooks";
import { ActionError } from "@/shared/ui/ActionError";
import { Confirm } from "@/shared/ui/ConfirmDialog";
import { AdminFilters } from "@/features/filter-admin-data";
import { RenameTeam } from "@/features/manage-team";
import { AddMemberModal } from "@/features/manage-team";
export function TeamsAdmin() {
  const store = usePlatformStore(),
    { busy, error, run } = useAction();
  const [search, setSearch] = useState(""),
    [create, setCreate] = useState(false),
    [selectedSnapshot, setSelected] = useState<Team | null>(null),
    [rename, setRename] = useState(false),
    [addMember, setAddMember] = useState(false),
    [confirm, setConfirm] = useState<"team" | string | null>(null);
  const selected = store.state.teams.find((item) => item.id === selectedSnapshot?.id) ?? null;
  const teams = store.state.teams.filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <AdminPageHeader
        title="КОМАНДЫ"
        description="Управление составами и капитанами."
        actions={
          <GlowButton onClick={() => setCreate(true)}>
            <Plus /> Создать команду
          </GlowButton>
        }
      />
      <AdminFilters
        search={search}
        setSearch={setSearch}
        onReset={() => {
          setSearch("");
        }}
      />
      {
        <DataTable
          headers={["Название", "Капитан", "Состав", "Действия"]}
          rows={teams.map((team) => [
            team.name,
            team.members.find((member) => member.captain)?.name ?? "—",
            `${team.members.length} игрока`,
            <button
              className="icon-button"
              onClick={() => setSelected(team)}
              key="v"
              aria-label="Просмотреть"
            >
              <Eye />
            </button>,
          ])}
        />
      }
      <ActionError message={error} />
      {create && (
        <TeamBuilderModal
          onClose={() => setCreate(false)}
          onCreated={() => void run("team-create", async () => {}, "Команда создана")}
        />
      )}{" "}
      {selected && (
        <aside className="side-panel glass">
          <button onClick={() => setSelected(null)} aria-label="Закрыть">
            ×
          </button>
          <h2>{selected.name}</h2>
          <div className="member-editor">
            {(store.state.teams.find((team) => team.id === selected.id)?.members ?? []).map(
              (member) => (
                <div className="member" key={member.id}>
                  <span>{member.name}</span>
                  {member.captain && <Badge>Капитан</Badge>}
                  <button
                    className="icon-button"
                    title="Назначить капитаном"
                    disabled={member.captain || Boolean(busy)}
                    onClick={() =>
                      void run(
                        `captain-${member.id}`,
                        () => store.assignCaptain(selected.id, member.id),
                        "Капитан назначен",
                      )
                    }
                  >
                    <Check />
                  </button>
                  <button
                    className="icon-button danger-icon"
                    title="Удалить участника"
                    onClick={() => setConfirm(member.id)}
                  >
                    <UserMinus />
                  </button>
                </div>
              ),
            )}
          </div>
          <GlowButton onClick={() => setAddMember(true)}>
            <Plus /> Добавить участника
          </GlowButton>
          <SecondaryButton onClick={() => setRename(true)}>
            <PenLine /> Изменить название
          </SecondaryButton>
          <Button variant="danger" className="danger" onClick={() => setConfirm("team")}>
            <Trash2 /> Удалить команду
          </Button>
        </aside>
      )}
      {addMember && selected && (
        <AddMemberModal
          team={store.state.teams.find((team) => team.id === selected.id) ?? selected}
          users={store.state.users}
          close={() => setAddMember(false)}
          save={(userId) =>
            void run(
              "add-member",
              () => store.addTeamMember(selected.id, userId),
              "Участник добавлен",
            ).then((ok) => {
              if (ok) setAddMember(false);
            })
          }
          busy={busy === "add-member"}
        />
      )}{" "}
      {rename && selected && (
        <RenameTeam
          team={selected}
          close={() => setRename(false)}
          save={(name) =>
            void run(
              "rename",
              () => store.updateTeam(selected.id, { name }),
              "Название изменено",
            ).then((ok) => {
              if (!ok) return;
              setSelected({ ...selected, name });
              setRename(false);
            })
          }
          busy={busy === "rename"}
        />
      )}{" "}
      {confirm && selected && (
        <Confirm
          title={confirm === "team" ? "Удалить команду?" : "Удалить участника?"}
          text="Опасное действие требует подтверждения."
          close={() => setConfirm(null)}
          confirm={() =>
            void run(
              "team-danger",
              () =>
                confirm === "team"
                  ? store.deleteTeam(selected.id)
                  : store.removeTeamMember(selected.id, confirm),
              confirm === "team" ? "Команда удалена" : "Участник удалён",
            ).then((ok) => {
              if (!ok) return;
              setConfirm(null);
              if (confirm === "team") setSelected(null);
            })
          }
          busy={busy === "team-danger"}
        />
      )}
    </>
  );
}
