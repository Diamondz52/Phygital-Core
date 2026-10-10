"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { UsersRound, Plus, ArrowRight } from "lucide-react";
import { type Tournament } from "@/entities/tournament";
import { usePlatformStore } from "@/entities/platform";
import { useAuth } from "@/entities/user";
import { useApp } from "@/shared/providers";
import { Button } from "@/shared/ui/Button";
import { Modal, ModalFooter } from "@/shared/ui/Modal";
import { SelectField } from "@/shared/ui/Select";

export function RegisterTeamModal({
  tournament,
  close,
  success,
  onLogin,
  renderCreateTeam,
}: {
  tournament: Tournament;
  close: () => void;
  success: () => void;
  onLogin: () => void;
  renderCreateTeam: (close: () => void, create: (name: string) => Promise<void>) => ReactNode;
}) {
  const { user } = useAuth(),
    store = usePlatformStore(),
    { notify } = useApp();
  const available = user
    ? store.state.teams.filter((team) =>
        team.members.some((member) => member.id === user.id && member.captain),
      )
    : [];
  const [selected, setSelected] = useState(available[0]?.id ?? ""),
    [info, setInfo] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [creating, setCreating] = useState(false);
  const formId = useId(),
    teamLabelId = useId(),
    messageId = useId(),
    locked = useRef(false);
  const selectedId = available.some((item) => item.id === selected)
    ? selected
    : (available[0]?.id ?? "");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      await store.submitTournamentApplication(selectedId, tournament.id, info);
      success();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось отправить заявку");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  if (creating && user)
    return renderCreateTeam(
      () => setCreating(false),
      async (name) => {
        const team = await store.createCaptainTeam(name);
        setSelected(team.id);
        setCreating(false);
        notify("Команда создана. Теперь можно подать заявку");
      },
    );
  return (
    <Modal
      title="Заявка на турнир"
      subtitle={tournament.name}
      className="tournament-application-modal"
      onClose={close}
      busy={busy}
      footer={
        <ModalFooter>
          <Button type="button" onClick={close} disabled={busy}>
            Отмена
          </Button>
          {!user ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                close();
                onLogin();
              }}
            >
              Войти
            </Button>
          ) : (
            available.length > 0 && (
              <Button variant="primary" type="submit" form={formId} loading={busy}>
                Отправить заявку <ArrowRight />
              </Button>
            )
          )}
        </ModalFooter>
      }
    >
      {!user ? (
        <div className="application-empty">
          <UsersRound aria-hidden="true" />
          <h3>Требуется авторизация</h3>
          <p>Войдите в аккаунт, чтобы система проверила право подачи заявки.</p>
        </div>
      ) : !available.length ? (
        <div className="application-empty">
          <UsersRound aria-hidden="true" />
          <h3>У вас нет команд для подачи заявки</h3>
          <p>Подать заявку на турнир может только капитан команды.</p>
          <Button type="button" variant="primary" onClick={() => setCreating(true)}>
            <Plus />
            Создать команду
          </Button>
        </div>
      ) : (
        <form id={formId} className="application-form" onSubmit={submit} aria-busy={busy}>
          <div className="application-field">
            <label id={teamLabelId}>
              Команда <b className="required">*</b>
            </label>
            <SelectField
              labelId={teamLabelId}
              name="teamId"
              required
              value={selectedId}
              disabled={busy}
              onChange={setSelected}
              options={available.map((item) => ({ value: item.id, label: item.name }))}
            />
          </div>
          <div className="application-field">
            <label htmlFor={messageId}>
              Дополнительная информация<span className="field-hint">Необязательно</span>
            </label>
            <textarea
              id={messageId}
              aria-describedby={`${messageId}-count`}
              name="additionalInfo"
              maxLength={500}
              disabled={busy}
              value={info}
              onChange={(event) => setInfo(event.target.value)}
              placeholder="Сообщение организатору"
            />
            <small className="field-count" id={`${messageId}-count`}>
              {info.length}/500
            </small>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}
