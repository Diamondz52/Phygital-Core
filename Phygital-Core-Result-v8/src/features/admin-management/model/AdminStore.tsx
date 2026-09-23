"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { logs as seedLogs, teamApplications as seedTeamApplications, teams as seedTeams, tournamentApplications as seedTournamentApplications, tournaments as seedTournaments, users as seedUsers, type AdminLog, type Status, type Team, type Tournament, type User } from "@/entities";
import { useAuth } from "@/features/auth";
import { authService, type RegisterPayload } from "@/features/auth";
import { adminService } from "../api/adminService";

export interface AdminState {
  users: User[];
  teams: Team[];
  tournaments: Tournament[];
  teamApplications: typeof seedTeamApplications;
  tournamentApplications: typeof seedTournamentApplications;
  logs: AdminLog[];
}

export interface TeamDraft { name: string; playerIds: string[]; captainId: string }
export interface TournamentDraft { name: string; shortDescription: string; city: string; imageName?: string; startAt: string; endAt?: string }

interface AdminActions {
  state: AdminState;
  createUser: (payload: RegisterPayload) => Promise<void>;
  updateUser: (id: string, patch: Partial<User>) => Promise<void>;
  resetPassword: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  createTeam: (draft: TeamDraft) => Promise<void>;
  updateTeam: (id: string, patch: Partial<Pick<Team, "name">>) => Promise<void>;
  addTeamMember: (teamId: string, userId: string) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  assignCaptain: (teamId: string, userId: string) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  updateTeamApplication: (id: string, status: Status) => Promise<void>;
  createTournament: (draft: TournamentDraft) => Promise<void>;
  updateTournament: (id: string, patch: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  updateTournamentApplication: (id: string, status: Status) => Promise<void>;
}

const initialState: AdminState = { users: seedUsers, teams: seedTeams, tournaments: seedTournaments, teamApplications: seedTeamApplications, tournamentApplications: seedTournamentApplications, logs: seedLogs };
const AdminContext = createContext<AdminActions | null>(null);

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const { user: signedInUser } = useAuth();
  const [state, setState] = useState(initialState);

  useEffect(() => { void adminService.getState(initialState).then(setState) }, []);

  const commit = async (action: string, entityType: string, entityId: string, details: string, mutate: (previous: AdminState) => AdminState) => {
    if (signedInUser?.role !== "ADMIN") throw new Error("Недостаточно прав для выполнения действия");
    setState(previous => {
      const changed = mutate(previous);
      const log: AdminLog = { id: crypto.randomUUID(), date: new Date().toLocaleString("ru-RU"), admin: `${signedInUser.firstName} ${signedInUser.lastName}`, action, entityType, entityId, details };
      const next = { ...changed, logs: [log, ...changed.logs] };
      void adminService.saveState(next);
      return next;
    });
  };

  const actions: AdminActions = ({
    state,
    createUser: async payload => {
      if (payload.password.length < 8) throw new Error("Пароль должен содержать не менее 8 символов");
      const account = await authService.adminCreateAccount(payload);
      await commit("Создание", "Пользователь", account.id, `Создан пользователь ${account.firstName} ${account.lastName}`, previous => ({ ...previous, users: [...previous.users, account] }));
    },
    updateUser: async (id, patch) => {
      const existing = state.users.find(user => user.id === id);
      if (!existing) throw new Error("Пользователь не найден");
      await authService.adminUpdateAccount(id, { ...existing, ...patch });
      await commit("Изменение", "Пользователь", id, "Обновлены данные пользователя", previous => ({ ...previous, users: previous.users.map(user => user.id === id ? { ...user, ...patch } : user) }));
    },
    resetPassword: async id => {
      const existing = state.users.find(user => user.id === id);
      if (!existing) throw new Error("Пользователь не найден");
      await authService.adminResetPassword({ ...existing, avatar: existing.avatar ?? "", bio: existing.bio ?? "" });
      await commit("Сброс пароля", "Пользователь", id, "Пароль пользователя заменён на 12345678", previous => previous);
    },
    deleteUser: async id => {
      await authService.adminDeleteAccount(id);
      await commit("Удаление", "Пользователь", id, "Пользователь удалён", previous => ({ ...previous, users: previous.users.filter(user => user.id !== id) }));
    },
    createTeam: draft => {
      if (!draft.name.trim()) return Promise.reject(new Error("Введите название команды"));
      if (!draft.playerIds.length) return Promise.reject(new Error("Добавьте хотя бы одного игрока"));
      if (!draft.playerIds.includes(draft.captainId)) return Promise.reject(new Error("Капитан должен занимать игровой слот"));
      if (new Set(draft.playerIds).size !== draft.playerIds.length) return Promise.reject(new Error("Игрок не может занимать несколько слотов"));
      if (signedInUser && draft.playerIds.includes(signedInUser.id)) return Promise.reject(new Error("Администратор не может добавить себя в команду"));
      const id = crypto.randomUUID();
      return commit("Создание", "Команда", id, `Создана команда «${draft.name}»`, previous => ({ ...previous, teams: [...previous.teams, { id, name: draft.name.trim(), discipline: "Фиджитал-спорт", members: draft.playerIds.map(userId => { const user = previous.users.find(item => item.id === userId)!; return { id: user.id, name: `${user.firstName} ${user.lastName}`, captain: user.id === draft.captainId } }) }] }));
    },
    updateTeam: (id, patch) => commit("Изменение", "Команда", id, "Изменено название команды", previous => ({ ...previous, teams: previous.teams.map(team => team.id === id ? { ...team, ...patch } : team) })),
    addTeamMember: (teamId, userId) => {
      if (userId === signedInUser?.id) return Promise.reject(new Error("Администратор не может добавить себя в команду"));
      const user = state.users.find(item => item.id === userId), team = state.teams.find(item => item.id === teamId);
      if (!user || !team) return Promise.reject(new Error("Пользователь или команда не найдены"));
      if (team.members.some(member => member.id === userId)) return Promise.reject(new Error("Пользователь уже состоит в команде"));
      return commit("Изменение", "Команда", teamId, `Добавлен участник ${user.firstName} ${user.lastName}`, previous => ({ ...previous, teams: previous.teams.map(item => item.id === teamId ? { ...item, members: [...item.members, { id: user.id, name: `${user.firstName} ${user.lastName}` }] } : item) }));
    },
    removeTeamMember: (teamId, userId) => commit("Изменение", "Команда", teamId, "Удалён участник команды", previous => ({ ...previous, teams: previous.teams.map(team => team.id === teamId ? { ...team, members: team.members.filter(member => member.id !== userId) } : team) })),
    assignCaptain: (teamId, userId) => commit("Изменение", "Команда", teamId, "Назначен новый капитан", previous => ({ ...previous, teams: previous.teams.map(team => team.id === teamId ? { ...team, members: team.members.map(member => ({ ...member, captain: member.id === userId })) } : team) })),
    deleteTeam: id => commit("Удаление", "Команда", id, "Команда удалена", previous => ({ ...previous, teams: previous.teams.filter(team => team.id !== id) })),
    updateTeamApplication: (id, status) => commit(status === "APPROVED" ? "Одобрение" : "Отклонение", "Заявка на команду", id, `Статус заявки изменён на ${status}`, previous => ({ ...previous, teamApplications: previous.teamApplications.map(application => application.id === id ? { ...application, status } : application) })),
    createTournament: draft => {
      if (!draft.name.trim() || !draft.shortDescription.trim() || !draft.city.trim() || !draft.startAt) return Promise.reject(new Error("Заполните обязательные поля"));
      if (draft.endAt && new Date(draft.endAt) <= new Date(draft.startAt)) return Promise.reject(new Error("Окончание должно быть позднее начала"));
      const id = `${draft.name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-")}-${Date.now()}`;
      return commit("Создание", "Турнир", id, `Создан турнир «${draft.name}»`, previous => ({ ...previous, tournaments: [...previous.tournaments, { id, publicNumber: "", name: draft.name.trim(), discipline: "", format: "", city: draft.city.trim(), venue: "", shortDescription: draft.shortDescription.trim(), description: draft.shortDescription.trim(), startAt: draft.startAt, endAt: draft.endAt ?? "", registrationEndsAt: draft.startAt, rules: [], imageName: draft.imageName }] }));
    },
    updateTournament: (id, patch) => commit("Изменение", "Турнир", id, "Обновлены данные турнира", previous => ({ ...previous, tournaments: previous.tournaments.map(tournament => tournament.id === id ? { ...tournament, ...patch } : tournament) })),
    deleteTournament: id => commit("Удаление", "Турнир", id, "Турнир удалён", previous => ({ ...previous, tournaments: previous.tournaments.filter(tournament => tournament.id !== id) })),
    updateTournamentApplication: (id, status) => commit(status === "APPROVED" ? "Одобрение" : "Отклонение", "Заявка на турнир", id, `Статус заявки изменён на ${status}`, previous => ({ ...previous, tournamentApplications: previous.tournamentApplications.map(application => application.id === id ? { ...application, status } : application) })),
  });

  return <AdminContext.Provider value={actions}>{children}</AdminContext.Provider>;
}

export function useAdminStore() {
  const value = useContext(AdminContext);
  if (!value) throw new Error("useAdminStore requires AdminStoreProvider");
  return value;
}
