import { type PlatformActions } from "../model/types";

import { type ActionContext } from "./actionContext";
// Domain operations share one permission and atomic storage boundary.
export function createTournamentActions(
  context: ActionContext,
): Pick<
  PlatformActions,
  | "submitTournamentApplication"
  | "createTournament"
  | "updateTournament"
  | "deleteTournament"
  | "updateTournamentApplication"
> {
  const { state, signedInUser, mutate, withLog, commitAdmin, fullName } = context;
  return {
    // Капитан определяется из состава, а не вводится в пользовательской форме.
    submitTournamentApplication: async (teamId, tournamentId, additionalInfo) => {
      if (!signedInUser) throw new Error("Требуется авторизация");
      const team = state.teams.find((item) => item.id === teamId),
        tournament = state.tournaments.find((item) => item.id === tournamentId);
      if (!team || !tournament) throw new Error("Команда или турнир не найдены");
      if (!team.members.some((member) => member.id === signedInUser.id && member.captain))
        throw new Error("Подать заявку может только капитан команды");
      if (additionalInfo.length > 500)
        throw new Error("Дополнительная информация не должна превышать 500 символов");
      if (
        state.tournamentApplications.some(
          (item) =>
            item.teamId === teamId &&
            item.tournamentId === tournamentId &&
            item.status !== "REJECTED",
        )
      )
        throw new Error("Заявка этой команды уже отправлена");
      const id = crypto.randomUUID(),
        application = {
          id,
          teamId,
          tournamentId,
          captainName: fullName(signedInUser),
          additionalInfo: additionalInfo.trim(),
          status: "NEW" as const,
          createdAt: new Date().toISOString(),
        };
      await mutate((previous) =>
        withLog(
          {
            ...previous,
            tournamentApplications: [application, ...previous.tournamentApplications],
          },
          fullName(signedInUser),
          "Создание",
          "Заявка на турнир",
          id,
          `Подана заявка команды «${team.name}» на «${tournament.name}»`,
        ),
      );
    },
    createTournament: (draft) => {
      if (
        !draft.name.trim() ||
        !draft.shortDescription.trim() ||
        !draft.city.trim() ||
        !draft.startAt ||
        !draft.endAt
      )
        return Promise.reject(new Error("Заполните обязательные поля"));
      if (draft.shortDescription.length > 500)
        return Promise.reject(new Error("Краткое описание не должно превышать 500 символов"));
      if (!Number.isFinite(Date.parse(draft.startAt)) || !Number.isFinite(Date.parse(draft.endAt)))
        return Promise.reject(new Error("Укажите корректные даты"));
      if (new Date(draft.endAt) <= new Date(draft.startAt))
        return Promise.reject(new Error("Окончание должно быть позднее начала"));
      const id = `${draft.name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-")}-${Date.now()}`;
      return commitAdmin("Создание", "Турнир", id, `Создан турнир «${draft.name}»`, (previous) => ({
        ...previous,
        tournaments: [
          ...previous.tournaments,
          {
            id,
            publicNumber: "",
            name: draft.name.trim(),
            discipline: "",
            format: "",
            city: draft.city.trim(),
            venue: "",
            shortDescription: draft.shortDescription.trim(),
            description: draft.fullDescription?.trim() || draft.shortDescription.trim(),
            startAt: draft.startAt,
            endAt: draft.endAt ?? "",
            registrationEndsAt: draft.startAt,
            rules: [],
            imageName: draft.imageName,
            imageUrl: draft.imageUrl,
          },
        ],
      }));
    },
    updateTournament: (id, patch) =>
      commitAdmin("Изменение", "Турнир", id, "Обновлены данные турнира", (previous) => {
        const existing = previous.tournaments.find((item) => item.id === id);
        if (!existing) throw new Error("Турнир не найден");
        const next = { ...existing, ...patch };
        if (
          !next.name.trim() ||
          !next.shortDescription.trim() ||
          !next.city.trim() ||
          !next.startAt ||
          !next.endAt
        )
          throw new Error("Заполните обязательные поля");
        if (next.shortDescription.length > 500)
          throw new Error("Краткое описание не должно превышать 500 символов");
        if (!Number.isFinite(Date.parse(next.startAt)) || !Number.isFinite(Date.parse(next.endAt)))
          throw new Error("Укажите корректные даты");
        if (new Date(next.endAt) <= new Date(next.startAt))
          throw new Error("Окончание должно быть позднее начала");
        return {
          ...previous,
          tournaments: previous.tournaments.map((item) =>
            item.id === id
              ? {
                  ...next,
                  name: next.name.trim(),
                  city: next.city.trim(),
                  shortDescription: next.shortDescription.trim(),
                }
              : item,
          ),
        };
      }),
    deleteTournament: (id) =>
      commitAdmin("Удаление", "Турнир", id, "Турнир и связанные заявки удалены", (previous) => {
        if (!previous.tournaments.some((item) => item.id === id))
          throw new Error("Турнир не найден");
        return {
          ...previous,
          tournaments: previous.tournaments.filter((tournament) => tournament.id !== id),
          tournamentApplications: previous.tournamentApplications.filter(
            (item) => item.tournamentId !== id,
          ),
        };
      }),
    updateTournamentApplication: (id, status) =>
      commitAdmin(
        status === "APPROVED" ? "Одобрение" : "Отклонение",
        "Заявка на турнир",
        id,
        `Статус заявки изменён на ${status}`,
        (previous) => ({
          ...previous,
          tournamentApplications: previous.tournamentApplications.map((application) =>
            application.id === id ? { ...application, status } : application,
          ),
        }),
      ),
  };
}
