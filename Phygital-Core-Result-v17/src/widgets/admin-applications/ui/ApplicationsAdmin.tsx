"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { usePlatformStore } from "@/entities/platform";
import { AdminPageHeader } from "@/shared/ui/SectionHeader";
import { Badge } from "@/shared/ui/Badge";
import { DataTable } from "@/shared/ui/DataTable";

import { useAction } from "@/shared/hooks";
import { ActionError } from "@/shared/ui/ActionError";
import { AdminFilters } from "@/features/filter-admin-data";
import { statusText } from "@/entities/tournament-application";
import { statusTone } from "@/entities/tournament-application";
import { ApplicationPanel } from "@/entities/tournament-application";
export function ApplicationsAdmin() {
  const store = usePlatformStore(),
    { busy, error, run } = useAction();
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("ALL"),
    [selected, setSelected] = useState<(typeof store.state.tournamentApplications)[number] | null>(
      null,
    );
  const applications = store.state.tournamentApplications.filter((item) => {
    const team = store.state.teams.find((value) => value.id === item.teamId)?.name ?? "";
    const tournament =
      store.state.tournaments.find((value) => value.id === item.tournamentId)?.name ?? "";
    return (
      (status === "ALL" || item.status === status) &&
      `${team} ${tournament} ${item.captainName}`.toLowerCase().includes(search.toLowerCase())
    );
  });
  return (
    <>
      <AdminPageHeader
        title="ЗАЯВКИ НА ТУРНИРЫ"
        description="Просмотр и обработка заявок команд."
      />
      <AdminFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        onReset={() => {
          setSearch("");
          setStatus("ALL");
        }}
      />
      <DataTable
        headers={["Команда", "Капитан", "Турнир", "Дата", "Статус", "Просмотр"]}
        rows={applications.map((item) => [
          store.state.teams.find((team) => team.id === item.teamId)?.name ?? "—",
          item.captainName,
          store.state.tournaments.find((tournament) => tournament.id === item.tournamentId)?.name ??
            "—",
          item.createdAt,
          <Badge key="s" tone={statusTone[item.status]}>
            {statusText[item.status]}
          </Badge>,
          <button
            key="v"
            className="icon-button"
            onClick={() => setSelected(item)}
            aria-label="Просмотреть"
          >
            <Eye />
          </button>,
        ])}
      />
      <ActionError message={error} />
      {selected && (
        <ApplicationPanel
          title="Заявка на турнир"
          body={
            <>
              <h3>{store.state.teams.find((team) => team.id === selected.teamId)?.name}</h3>
              <p>Капитан: {selected.captainName}</p>
              <p>{selected.additionalInfo || "Дополнительная информация не указана"}</p>
              <Badge
                tone={
                  statusTone[
                    store.state.tournamentApplications.find((item) => item.id === selected.id)
                      ?.status ?? selected.status
                  ]
                }
              >
                {
                  statusText[
                    store.state.tournamentApplications.find((item) => item.id === selected.id)
                      ?.status ?? selected.status
                  ]
                }
              </Badge>
            </>
          }
          close={() => setSelected(null)}
          approve={() =>
            void run(
              "approve",
              () => store.updateTournamentApplication(selected.id, "APPROVED"),
              "Заявка одобрена",
            )
          }
          reject={() =>
            void run(
              "reject",
              () => store.updateTournamentApplication(selected.id, "REJECTED"),
              "Заявка отклонена",
            )
          }
          busy={Boolean(busy)}
        />
      )}
    </>
  );
}
