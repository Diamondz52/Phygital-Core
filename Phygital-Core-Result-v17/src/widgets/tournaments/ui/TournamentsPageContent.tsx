"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, MapPin, UsersRound, ArrowRight } from "lucide-react";
import { tournamentStatus } from "@/entities/tournament";
import { usePlatformStore } from "@/entities/platform";
import { useApp } from "@/shared/providers";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Modal, ModalFooter } from "@/shared/ui/Modal";

import { RegisterTeamModal } from "@/features/register-team-for-tournament";
import { useAuthModal } from "@/features/auth";
import { CreateTeamModal } from "@/features/create-team";

const statusLabel = { upcoming: "Предстоящий", active: "Идёт", completed: "Завершён" } as const;

const date = (value: string) =>
  new Date(value).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

const time = (value: string) =>
  new Date(value).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

export function TournamentsPageContent() {
  const { openAuth } = useAuthModal();
  const store = usePlatformStore(),
    { notify } = useApp();
  const [applyId, setApplyId] = useState<string | null>(null),
    [detailsId, setDetailsId] = useState<string | null>(null);
  const details = store.state.tournaments.find((item) => item.id === detailsId),
    apply = store.state.tournaments.find((item) => item.id === applyId);
  const approved = details
    ? store.state.tournamentApplications.filter(
        (item) => item.tournamentId === details.id && item.status === "APPROVED",
      ).length
    : 0;
  return (
    <>
      <section className="content-section tournaments-list">
        <h2>ВСЕ ТУРНИРЫ</h2>
        {store.state.tournaments.length ? (
          store.state.tournaments.map((tournament) => {
            const status = tournamentStatus(tournament);
            return (
              <article className="tournament-card glass" key={tournament.id}>
                <div className="tournament-image">
                  <img
                    src={tournament.imageUrl || "/trophy-arena.webp"}
                    alt="Кубок фиджитал-турнира"
                  />
                </div>
                <div>
                  <Badge
                    tone={status === "active" ? "green" : status === "completed" ? "red" : "blue"}
                  >
                    {statusLabel[status]}
                  </Badge>
                  <h3>{tournament.name}</h3>
                  <p className="facts">
                    <span>
                      <CalendarDays />
                      {new Date(tournament.startAt).toLocaleDateString("ru-RU")}
                    </span>
                    <span>
                      <MapPin />
                      {tournament.city}
                    </span>
                  </p>
                  <p>{tournament.description}</p>
                  <div className="card-actions">
                    <Button type="button" onClick={() => setDetailsId(tournament.id)}>
                      Подробнее о турнире
                    </Button>
                    {status !== "completed" && (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => setApplyId(tournament.id)}
                      >
                        Зарегистрировать команду <ArrowRight />
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState />
        )}
      </section>
      {details && (
        <Modal
          title={details.name}
          subtitle={details.shortDescription || undefined}
          className="tournament-detail-modal"
          eyebrow={
            <Badge
              tone={
                tournamentStatus(details) === "active"
                  ? "green"
                  : tournamentStatus(details) === "completed"
                    ? "red"
                    : "blue"
              }
            >
              {statusLabel[tournamentStatus(details)]}
            </Badge>
          }
          onClose={() => setDetailsId(null)}
          footer={
            <ModalFooter>
              <Button type="button" onClick={() => setDetailsId(null)}>
                Закрыть
              </Button>
              {tournamentStatus(details) !== "completed" && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setApplyId(details.id);
                    setDetailsId(null);
                  }}
                >
                  Зарегистрировать команду <ArrowRight />
                </Button>
              )}
            </ModalFooter>
          }
        >
          <dl className="tournament-meta">
            {details.startAt && (
              <div>
                <CalendarDays />
                <dt>Дата</dt>
                <dd>
                  {date(details.startAt)}
                  {details.endAt && date(details.endAt) !== date(details.startAt) && (
                    <> — {date(details.endAt)}</>
                  )}
                </dd>
              </div>
            )}
            {details.startAt && (
              <div>
                <Clock3 />
                <dt>Время начала</dt>
                <dd>{time(details.startAt)}</dd>
              </div>
            )}
            {(details.city || details.venue) && (
              <div>
                <MapPin />
                <dt>Место</dt>
                <dd>{[details.city, details.venue].filter(Boolean).join(" · ")}</dd>
              </div>
            )}
            <div>
              <UsersRound />
              <dt>Подтверждённые команды</dt>
              <dd>{approved}</dd>
            </div>
          </dl>
          {details.description && (
            <section className="tournament-extra">
              <h3>О турнире</h3>
              <p>{details.description}</p>
              {details.endAt && (
                <p>
                  Окончание: {date(details.endAt)}, {time(details.endAt)}.
                </p>
              )}
            </section>
          )}
          <section className="tournament-extra">
            <Link href="/rules" onClick={() => setDetailsId(null)}>
              Правила участия →
            </Link>
          </section>
        </Modal>
      )}
      {apply && (
        <RegisterTeamModal
          tournament={apply}
          close={() => setApplyId(null)}
          onLogin={() => openAuth("login", "/tournaments")}
          renderCreateTeam={(close, create) => <CreateTeamModal close={close} create={create} />}
          success={() => {
            setApplyId(null);
            notify("Заявка на турнир отправлена");
          }}
        />
      )}
    </>
  );
}
