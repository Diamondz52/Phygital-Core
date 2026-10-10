import { type Team } from "@/entities/team/@x/platform";

import { type PlatformActions } from "../model/types";

import { type ActionContext } from "./actionContext";
// Domain operations share one permission and atomic storage boundary.
export function createTeamActions(
  context: ActionContext,
): Pick<
  PlatformActions,
  | "createTeam"
  | "createCaptainTeam"
  | "updateTeam"
  | "addTeamMember"
  | "removeTeamMember"
  | "leaveTeam"
  | "assignCaptain"
  | "deleteTeam"
> {
  const { state, signedInUser, mutate, withLog, commitAdmin, commitTeam, fullName } = context;
  return {
    createTeam: (draft) => {
      if (!draft.name.trim()) return Promise.reject(new Error("Введите название команды"));
      if (!draft.playerIds.length)
        return Promise.reject(new Error("Добавьте хотя бы одного игрока"));
      if (!draft.playerIds.includes(draft.captainId))
        return Promise.reject(new Error("Капитан должен занимать игровой слот"));
      if (new Set(draft.playerIds).size !== draft.playerIds.length)
        return Promise.reject(new Error("Игрок не может занимать несколько слотов"));
      if (signedInUser && draft.playerIds.includes(signedInUser.id))
        return Promise.reject(new Error("Администратор не может добавить себя в команду"));
      if (
        draft.playerIds.some(
          (id) => !state.users.some((user) => user.id === id && user.role !== "ADMIN"),
        )
      )
        return Promise.reject(new Error("Добавляйте только зарегистрированных игроков"));
      if (state.teams.some((team) => team.name.toLowerCase() === draft.name.trim().toLowerCase()))
        return Promise.reject(new Error("Команда с таким названием уже существует"));
      const id = crypto.randomUUID();
      return commitAdmin(
        "Создание",
        "Команда",
        id,
        `Создана команда «${draft.name}»`,
        (previous) => ({
          ...previous,
          teams: [
            ...previous.teams,
            {
              id,
              name: draft.name.trim(),
              discipline: "Фиджитал-спорт",
              createdAt: new Date().toISOString(),
              members: draft.playerIds.map((userId) => {
                const user = previous.users.find((item) => item.id === userId)!;
                return { id: user.id, name: fullName(user), captain: user.id === draft.captainId };
              }),
            },
          ],
        }),
      );
    },
    createCaptainTeam: async (name) => {
      if (!signedInUser) throw new Error("Войдите в аккаунт, чтобы создать команду");
      if (signedInUser.role === "ADMIN")
        throw new Error("Администратор не может входить в игровой состав");
      if (!name.trim()) throw new Error("Введите название команды");
      if (state.teams.some((team) => team.name.toLowerCase() === name.trim().toLowerCase()))
        throw new Error("Команда с таким названием уже существует");
      // Создание немедленное: создатель сразу капитан, отдельной заявки нет.
      const team: Team = {
        id: crypto.randomUUID(),
        name: name.trim(),
        discipline: "Фиджитал-спорт",
        createdAt: new Date().toISOString(),
        members: [{ id: signedInUser.id, name: fullName(signedInUser), captain: true }],
      };
      await mutate((previous) =>
        withLog(
          { ...previous, teams: [...previous.teams, team] },
          fullName(signedInUser),
          "Создание",
          "Команда",
          team.id,
          `Создана команда «${team.name}»`,
        ),
      );
      return team;
    },
    updateTeam: (id, patch) =>
      commitTeam(id, "Изменение", "Изменено название команды", (previous) => {
        const name = patch.name?.trim();
        if (!name) throw new Error("Введите название команды");
        if (name.length > 80) throw new Error("Название команды не должно превышать 80 символов");
        if (!previous.teams.some((team) => team.id === id)) throw new Error("Команда не найдена");
        if (
          previous.teams.some(
            (team) => team.id !== id && team.name.toLowerCase() === name.toLowerCase(),
          )
        )
          throw new Error("Команда с таким названием уже существует");
        return {
          ...previous,
          teams: previous.teams.map((team) =>
            team.id === id ? { ...team, name, updatedAt: new Date().toISOString() } : team,
          ),
        };
      }),
    addTeamMember: (teamId, userId) => {
      if (userId === signedInUser?.id)
        return Promise.reject(new Error("Администратор не может добавить себя в команду"));
      const user = state.users.find((item) => item.id === userId),
        team = state.teams.find((item) => item.id === teamId);
      if (user?.role === "ADMIN")
        return Promise.reject(new Error("Администратора нельзя добавить в игровой состав"));
      if (!user || !team) return Promise.reject(new Error("Пользователь или команда не найдены"));
      if (team.members.some((member) => member.id === userId))
        return Promise.reject(new Error("Пользователь уже состоит в команде"));
      return commitAdmin(
        "Изменение",
        "Команда",
        teamId,
        `Добавлен участник ${fullName(user)}`,
        (previous) => ({
          ...previous,
          teams: previous.teams.map((item) =>
            item.id === teamId
              ? {
                  ...item,
                  updatedAt: new Date().toISOString(),
                  members: [...item.members, { id: user.id, name: fullName(user) }],
                }
              : item,
          ),
        }),
      );
    },
    removeTeamMember: (teamId, userId) => {
      const member = state.teams
        .find((team) => team.id === teamId)
        ?.members.find((item) => item.id === userId);
      if (!member) return Promise.reject(new Error("Участник не найден"));
      if (member.captain) return Promise.reject(new Error("Сначала назначьте другого капитана"));
      return commitTeam(teamId, "Изменение", `Удалён участник ${member.name}`, (previous) => {
        const currentMember = previous.teams
          .find((team) => team.id === teamId)
          ?.members.find((item) => item.id === userId);
        if (!currentMember) throw new Error("Участник не найден");
        if (currentMember.captain) throw new Error("Сначала назначьте другого капитана");
        return {
          ...previous,
          teams: previous.teams.map((team) =>
            team.id === teamId
              ? {
                  ...team,
                  updatedAt: new Date().toISOString(),
                  members: team.members.filter((item) => item.id !== userId),
                }
              : team,
          ),
        };
      });
    },
    assignCaptain: (teamId, userId) => {
      const member = state.teams
        .find((team) => team.id === teamId)
        ?.members.find((item) => item.id === userId);
      if (!member) return Promise.reject(new Error("Капитан должен быть участником команды"));
      return commitTeam(teamId, "Изменение", `Капитаном назначен ${member.name}`, (previous) => {
        if (
          !previous.teams
            .find((team) => team.id === teamId)
            ?.members.some((item) => item.id === userId)
        )
          throw new Error("Капитан должен быть участником команды");
        return {
          ...previous,
          teams: previous.teams.map((team) =>
            team.id === teamId
              ? {
                  ...team,
                  updatedAt: new Date().toISOString(),
                  members: team.members.map((item) => ({ ...item, captain: item.id === userId })),
                }
              : team,
          ),
        };
      });
    },
    leaveTeam: async (teamId) => {
      if (!signedInUser) throw new Error("Войдите в аккаунт");
      await mutate((previous) => {
        const team = previous.teams.find((item) => item.id === teamId);
        if (!team) throw new Error("Команда не найдена");
        const member = team.members.find((item) => item.id === signedInUser.id);
        if (!member) throw new Error("Вы не состоите в этой команде");
        if (member.captain) throw new Error("Сначала передайте права капитана или удалите команду");
        return withLog(
          {
            ...previous,
            teams: previous.teams.map((item) =>
              item.id === teamId
                ? {
                    ...item,
                    members: item.members.filter((player) => player.id !== signedInUser.id),
                    updatedAt: new Date().toISOString(),
                  }
                : item,
            ),
          },
          fullName(signedInUser),
          "Выход",
          "Команда",
          teamId,
          `${fullName(signedInUser)} покинул команду`,
        );
      });
    },
    deleteTeam: (id) =>
      commitTeam(id, "Удаление", "Команда удалена", (previous) => ({
        ...previous,
        teams: previous.teams.filter((team) => team.id !== id),
        invitations: previous.invitations.map((item) =>
          item.teamId === id && item.status === "pending"
            ? { ...item, status: "cancelled", respondedAt: new Date().toISOString() }
            : item,
        ),
        notifications: previous.notifications.map((item) =>
          previous.invitations.some(
            (invite) => invite.teamId === id && invite.id === item.invitationId,
          )
            ? { ...item, read: true }
            : item,
        ),
        tournamentApplications: previous.tournamentApplications.filter(
          (item) => item.teamId !== id,
        ),
      })),
  };
}
