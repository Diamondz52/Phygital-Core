"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { CircleUserRound, RefreshCw, Search, Send } from "lucide-react";
import { type Team } from "@/entities/team";
import { type User } from "@/entities/user";
import { usePlatformStore } from "@/entities/platform";
import { useAuth } from "@/entities/user";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";

import { maskPhone } from "@/entities/user";
import { matchesPlayerSearch } from "@/entities/user";
export function InvitePlayersModal({
  team,
  close,
  notify,
}: {
  team: Team;
  close: () => void;
  notify: (message: string) => void;
}) {
  const store = usePlatformStore();
  const { user } = useAuth();
  const [query, setQuery] = useState(""),
    [failed, setFailed] = useState(false),
    [busy, setBusy] = useState("");
  const debounced = useDeferredValue(query),
    loading = debounced !== query;
  const results = useMemo(() => {
    return store.state.users.filter(
      (candidate) =>
        candidate.id !== user?.id &&
        candidate.role !== "ADMIN" &&
        matchesPlayerSearch(candidate, debounced),
    );
  }, [debounced, store.state.users, user?.id]);
  const statusFor = (candidate: User) => {
    if (team.members.some((member) => member.id === candidate.id)) return "member";
    const latest = store.state.invitations.find(
      (item) => item.teamId === team.id && item.recipientId === candidate.id,
    );
    return latest?.status === "accepted" ? "available" : (latest?.status ?? "available");
  };
  const invite = async (candidate: User) => {
    if (busy) return;
    setBusy(candidate.id);
    try {
      await store.sendInvitation(team.id, candidate.id);
      notify(`Приглашение для ${candidate.firstName} отправлено`);
    } catch (reason) {
      notify(
        `Ошибка: ${reason instanceof Error ? reason.message : "Не удалось отправить приглашение"}`,
      );
    } finally {
      setBusy("");
    }
  };
  const invitations = store.state.invitations.filter((item) => item.teamId === team.id);
  const cancel = async (id: string) => {
    if (busy) return;
    setBusy(id);
    try {
      await store.cancelInvitation(id);
      notify("Приглашение отменено");
    } catch (reason) {
      notify(
        `Ошибка: ${reason instanceof Error ? reason.message : "Не удалось отменить приглашение"}`,
      );
    } finally {
      setBusy("");
    }
  };
  const retry = () => setFailed(false);
  return (
    <Modal
      title={`Пригласить в ${team.name}`}
      subtitle="Игрок войдёт в состав только после принятия приглашения."
      onClose={close}
      busy={Boolean(busy)}
    >
      <section className="player-search">
        <label className="search-field">
          <Search />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск игрока по имени или телефону"
            autoFocus
          />
        </label>
        {loading && <p className="loading-line">Ищем зарегистрированных пользователей…</p>}
        {failed && (
          <div className="search-state">
            <p className="form-error">Не удалось загрузить результаты.</p>
            <Button variant="secondary" className="secondary" onClick={retry}>
              <RefreshCw />
              Повторить
            </Button>
          </div>
        )}
        {!loading && !failed && query.trim() && !results.length && (
          <p className="search-state">Ничего не найдено. Проверьте имя или номер телефона.</p>
        )}
        <div className="invite-results">
          {!loading &&
            results.map((candidate) => {
              const status = statusFor(candidate);
              return (
                <div className="invite-result" key={candidate.id}>
                  <CircleUserRound />
                  <span>
                    <b>
                      {candidate.firstName} {candidate.lastName}
                    </b>
                    <small>{maskPhone(candidate.phone)}</small>
                  </span>
                  {status === "available" || status === "declined" || status === "cancelled" ? (
                    <Button
                      variant="secondary"
                      className="secondary"
                      disabled={Boolean(busy)}
                      loading={busy === candidate.id}
                      onClick={() => void invite(candidate)}
                    >
                      <Send />
                      {busy === candidate.id ? "Отправка…" : "Пригласить"}
                    </Button>
                  ) : (
                    <Badge tone={status === "member" ? "green" : "blue"}>
                      {status === "member" ? "Уже в составе" : "Уже приглашён"}
                    </Badge>
                  )}
                </div>
              );
            })}
        </div>
        {invitations.length > 0 && (
          <div className="invitation-history">
            <h3>Приглашения</h3>
            {invitations.map((invitation) => {
              const recipient = store.state.users.find(
                (item) => item.id === invitation.recipientId,
              );
              return (
                <div key={invitation.id}>
                  <span>
                    {recipient ? `${recipient.firstName} ${recipient.lastName}` : "Пользователь"}
                  </span>
                  <Badge
                    tone={
                      invitation.status === "accepted"
                        ? "green"
                        : invitation.status === "declined" || invitation.status === "cancelled"
                          ? "red"
                          : "blue"
                    }
                  >
                    {invitation.status === "pending"
                      ? "Ожидает ответа"
                      : invitation.status === "accepted"
                        ? "Принято"
                        : invitation.status === "declined"
                          ? "Отклонено"
                          : "Отменено"}
                  </Badge>
                  {invitation.status === "pending" && (
                    <button
                      className="text-button"
                      disabled={Boolean(busy)}
                      onClick={() => void cancel(invitation.id)}
                    >
                      {busy === invitation.id ? "Отмена…" : "Отменить"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </Modal>
  );
}
