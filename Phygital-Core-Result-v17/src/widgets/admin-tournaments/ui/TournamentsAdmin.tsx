"use client";

import { Button } from "@/shared/ui/Button";
import { useState } from "react";
import { Eye, PenLine, Plus, Trash2 } from "lucide-react";
import { tournamentStatus, type Tournament } from "@/entities/tournament";
import { usePlatformStore } from "@/entities/platform";
import { AdminPageHeader } from "@/shared/ui/SectionHeader";
import { Badge } from "@/shared/ui/Badge";
import { DataTable } from "@/shared/ui/DataTable";
import { GlowButton } from "@/shared/ui/Button";

import { useAction } from "@/shared/hooks";
import { ActionError } from "@/shared/ui/ActionError";
import { Confirm } from "@/shared/ui/ConfirmDialog";
import { AdminFilters } from "@/features/filter-admin-data";
import { TournamentForm } from "@/features/manage-tournament";
export function TournamentsAdmin() {
  const store = usePlatformStore(),
    { busy, error, run } = useAction();
  const [search, setSearch] = useState(""),
    [city, setCity] = useState("ALL"),
    [date, setDate] = useState(""),
    [create, setCreate] = useState(false),
    [selected, setSelected] = useState<Tournament | null>(null),
    [editing, setEditing] = useState<Tournament | null>(null),
    [confirm, setConfirm] = useState(false);
  const cities = [...new Set(store.state.tournaments.map((item) => item.city))],
    filtered = store.state.tournaments.filter(
      (item) =>
        item.name.toLowerCase().includes(search.toLowerCase()) &&
        (city === "ALL" || item.city === city) &&
        (!date || item.startAt.slice(0, 10) === date),
    );
  return (
    <>
      <AdminPageHeader
        title="ТУРНИРЫ"
        description="Создание и редактирование турниров; статус рассчитывается по датам."
        actions={
          <GlowButton onClick={() => setCreate(true)}>
            <Plus /> Создать турнир
          </GlowButton>
        }
      />
      <AdminFilters
        search={search}
        setSearch={setSearch}
        onReset={() => {
          setSearch("");
          setCity("ALL");
          setDate("");
        }}
        extra={
          <>
            <select
              aria-label="Фильтр города"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            >
              <option value="ALL">Все города</option>
              {cities.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
            <input
              aria-label="Фильтр даты"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </>
        }
      />
      <DataTable
        headers={["Турнир", "Дата", "Город", "Статус", "Действия"]}
        rows={filtered.map((item) => [
          item.name,
          new Date(item.startAt).toLocaleString("ru-RU"),
          item.city,
          <Badge
            key="s"
            tone={
              tournamentStatus(item) === "completed"
                ? "red"
                : tournamentStatus(item) === "active"
                  ? "green"
                  : "blue"
            }
          >
            {tournamentStatus(item) === "completed"
              ? "Завершён"
              : tournamentStatus(item) === "active"
                ? "Идёт"
                : "Предстоящий"}
          </Badge>,
          <button
            className="icon-button"
            key="v"
            onClick={() => setSelected(item)}
            aria-label="Просмотреть"
          >
            <Eye />
          </button>,
        ])}
      />
      <ActionError message={error} />
      {(create || editing) && (
        <TournamentForm
          tournament={editing}
          close={() => {
            setCreate(false);
            setEditing(null);
          }}
          save={(draft) =>
            void run(
              "tournament-save",
              () =>
                editing
                  ? store.updateTournament(editing.id, {
                      name: draft.name,
                      shortDescription: draft.shortDescription,
                      description: draft.fullDescription?.trim() || draft.shortDescription,
                      city: draft.city,
                      startAt: draft.startAt,
                      endAt: draft.endAt ?? "",
                      imageName: draft.imageName,
                      imageUrl: draft.imageUrl,
                    })
                  : store.createTournament(draft),
              editing ? "Турнир обновлён" : "Турнир создан",
            ).then((ok) => {
              if (!ok) return;
              setCreate(false);
              setEditing(null);
            })
          }
          busy={busy === "tournament-save"}
        />
      )}{" "}
      {selected && (
        <aside className="side-panel glass">
          <button onClick={() => setSelected(null)} aria-label="Закрыть">
            ×
          </button>
          <h2>{selected.name}</h2>
          <Badge>{selected.city}</Badge>
          <p>{selected.shortDescription}</p>
          <p>
            {new Date(selected.startAt).toLocaleString("ru-RU")}
            {selected.endAt ? ` — ${new Date(selected.endAt).toLocaleString("ru-RU")}` : ""}
          </p>
          <GlowButton
            onClick={() => {
              setEditing(selected);
              setSelected(null);
            }}
          >
            <PenLine /> Редактировать
          </GlowButton>
          <Button variant="danger" className="danger" onClick={() => setConfirm(true)}>
            <Trash2 /> Удалить турнир
          </Button>
        </aside>
      )}
      {confirm && selected && (
        <Confirm
          title="Удалить турнир?"
          text="Турнир исчезнет из списка и публичной части."
          close={() => setConfirm(false)}
          confirm={() =>
            void run(
              "delete-tournament",
              () => store.deleteTournament(selected.id),
              "Турнир удалён",
            ).then((ok) => {
              if (!ok) return;
              setConfirm(false);
              setSelected(null);
            })
          }
          busy={busy === "delete-tournament"}
        />
      )}
    </>
  );
}
