"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { logs as seedLogs, teamApplications as seedTeamApplications, teams as seedTeams, tournamentApplications as seedTournamentApplications, tournaments as seedTournaments, users as seedUsers, type AdminLog, type AppNotification, type InvitationStatus, type Status, type Team, type TeamInvitation, type Tournament, type User } from "@/entities";
import { authService, useAuth, type RegisterPayload } from "@/features/auth";
import { adminService } from "../api/adminService";
import type { Feedback } from "@/entities/feedback";

export interface AdminState {
  users: User[];
  teams: Team[];
  tournaments: Tournament[];
  teamApplications: typeof seedTeamApplications;
  tournamentApplications: typeof seedTournamentApplications;
  logs: AdminLog[];
  invitations: TeamInvitation[];
  notifications: AppNotification[];
  feedback: Feedback[];
}

export interface TeamDraft { name: string; playerIds: string[]; captainId: string }
export interface TournamentDraft { name: string; shortDescription: string; fullDescription?: string; city: string; imageName?: string; imageUrl?: string; startAt: string; endAt?: string }

interface AdminActions {
  state: AdminState;
  createUser: (payload: RegisterPayload) => Promise<void>;
  updateUser: (id: string, patch: Partial<User>) => Promise<void>;
  resetPassword: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  createTeam: (draft: TeamDraft) => Promise<void>;
  createCaptainTeam: (name: string) => Promise<Team>;
  sendInvitation: (teamId: string, recipientId: string) => Promise<void>;
  respondInvitation: (invitationId: string, response: "accepted" | "declined") => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  markNotificationsRead: () => void;
  submitTournamentApplication: (teamId: string, tournamentId: string, additionalInfo: string) => Promise<void>;
  updateTeam: (id: string, patch: Partial<Pick<Team, "name">>) => Promise<void>;
  addTeamMember: (teamId: string, userId: string) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  leaveTeam: (teamId: string) => Promise<void>;
  assignCaptain: (teamId: string, userId: string) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  updateTeamApplication: (id: string, status: Status) => Promise<void>;
  createTournament: (draft: TournamentDraft) => Promise<void>;
  updateTournament: (id: string, patch: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  updateTournamentApplication: (id: string, status: Status) => Promise<void>;
}

const initialState: AdminState = { users: seedUsers, teams: seedTeams, tournaments: seedTournaments, teamApplications: seedTeamApplications, tournamentApplications: seedTournamentApplications, logs: seedLogs, invitations: [], notifications: [], feedback: [] };
const AdminContext = createContext<AdminActions | null>(null);
const fullName = (user: Pick<User, "firstName" | "lastName">) => `${user.firstName} ${user.lastName}`.trim();

export function AdminStoreProvider({ children }: { children: ReactNode }) {
  const { user: signedInUser } = useAuth();
  const [state, setState] = useState(initialState);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    let active = true;
    const refresh = () => { void adminService.getState(initialState).then(saved => { if (active) { setState(saved); setStorageError(""); } }).catch(() => { if (active) setStorageError("Не удалось загрузить локальные данные. Проверьте доступ к хранилищу и перезагрузите страницу."); }); };
    const unsubscribe = adminService.subscribe(refresh); refresh();
    return () => { active = false; unsubscribe(); };
  }, []);
  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<User>).detail;
      if (!detail?.id) return;
      void adminService.updateState(previous => {
        const exists = previous.users.some(item => item.id === detail.id);
        const users = exists ? previous.users.map(item => item.id === detail.id ? { ...item, ...detail } : item) : [...previous.users, { ...detail, createdAt: new Date().toISOString() }];
        return { ...previous, users };
      }, initialState).then(setState).catch(() => setStorageError("Не удалось сохранить данные пользователя"));
    };
    window.addEventListener("phygital:user-sync", sync);
    return () => window.removeEventListener("phygital:user-sync", sync);
  }, []);

  const mutate = async (change: (previous: AdminState) => AdminState) => { const next = await adminService.updateState(change, initialState); setState(next); };
  const requireAdmin = () => { if (signedInUser?.role !== "ADMIN") throw new Error("Недостаточно прав для выполнения действия"); };
  const withLog = (previous: AdminState, actor: string, action: string, entityType: string, entityId: string, details: string) => ({ ...previous, logs: [{ id: crypto.randomUUID(), date: new Date().toISOString(), admin: actor, action, entityType, entityId, details }, ...previous.logs] });
  const commitAdmin = async (action: string, entityType: string, entityId: string, details: string, change: (previous: AdminState) => AdminState) => {
    if (signedInUser?.role !== "ADMIN") throw new Error("Недостаточно прав для выполнения действия");
    await mutate(previous => withLog(change(previous), fullName(signedInUser), action, entityType, entityId, details));
  };
  const commitTeam = async (teamId: string, action: string, details: string, change: (previous: AdminState) => AdminState) => {
    const team = state.teams.find(item => item.id === teamId);
    if (!team) throw new Error("Команда не найдена");
    if (!signedInUser || (signedInUser.role !== "ADMIN" && !team.members.some(member => member.id === signedInUser.id && member.captain))) throw new Error("Управлять командой может только капитан или администратор");
    await mutate(previous => {
      const current = previous.teams.find(item => item.id === teamId);
      if (!current) throw new Error("Команда не найдена");
      if (signedInUser.role !== "ADMIN" && !current.members.some(member => member.id === signedInUser.id && member.captain)) throw new Error("Управлять командой может только капитан или администратор");
      return withLog(change(previous), fullName(signedInUser), action, "Команда", teamId, details);
    });
  };

  const actions = useMemo<AdminActions>(() => ({
    state,
    createUser: async payload => { requireAdmin(); if (payload.password.length < 8) throw new Error("Пароль должен содержать не менее 8 символов"); const account = await authService.adminCreateAccount(payload); await commitAdmin("Создание", "Пользователь", account.id, `Создан пользователь ${fullName(account)}`, previous => ({ ...previous, users: [...previous.users.filter(item => item.id !== account.id), { ...account, createdAt: new Date().toISOString() }] })) },
    updateUser: async (id, patch) => { requireAdmin(); const existing = state.users.find(user => user.id === id); if (!existing) throw new Error("Пользователь не найден"); await authService.adminUpdateAccount(id, { ...existing, ...patch }); await commitAdmin("Изменение", "Пользователь", id, "Обновлены данные пользователя", previous => ({ ...previous, users: previous.users.map(user => user.id === id ? { ...user, ...patch } : user) })) },
    resetPassword: async id => { requireAdmin(); const existing = state.users.find(user => user.id === id); if (!existing) throw new Error("Пользователь не найден"); await authService.adminResetPassword({ ...existing, avatar: existing.avatar ?? "", bio: existing.bio ?? "" }); await commitAdmin("Сброс пароля", "Пользователь", id, "Пароль пользователя заменён на 12345678", previous => previous) },
    deleteUser: async id => { requireAdmin(); if(id===signedInUser?.id) throw new Error("Нельзя удалить текущий аккаунт"); if(state.teams.some(team=>team.members.some(member=>member.id===id&&member.captain))) throw new Error("Сначала назначьте другого капитана в командах пользователя"); await authService.adminDeleteAccount(id); await commitAdmin("Удаление", "Пользователь", id, "Пользователь удалён", previous => ({ ...previous, users: previous.users.filter(user => user.id !== id), teams:previous.teams.map(team=>({...team,members:team.members.filter(member=>member.id!==id)})), invitations:previous.invitations.filter(item=>item.recipientId!==id&&item.senderId!==id), notifications:previous.notifications.filter(item=>item.userId!==id) })) },
    createTeam: draft => {
      if (!draft.name.trim()) return Promise.reject(new Error("Введите название команды"));
      if (!draft.playerIds.length) return Promise.reject(new Error("Добавьте хотя бы одного игрока"));
      if (!draft.playerIds.includes(draft.captainId)) return Promise.reject(new Error("Капитан должен занимать игровой слот"));
      if (new Set(draft.playerIds).size !== draft.playerIds.length) return Promise.reject(new Error("Игрок не может занимать несколько слотов"));
      if (signedInUser && draft.playerIds.includes(signedInUser.id)) return Promise.reject(new Error("Администратор не может добавить себя в команду"));
      if(draft.playerIds.some(id=>!state.users.some(user=>user.id===id&&user.role!=="ADMIN"))) return Promise.reject(new Error("Добавляйте только зарегистрированных игроков"));
      if(state.teams.some(team=>team.name.toLowerCase()===draft.name.trim().toLowerCase())) return Promise.reject(new Error("Команда с таким названием уже существует"));
      const id = crypto.randomUUID();
      return commitAdmin("Создание", "Команда", id, `Создана команда «${draft.name}»`, previous => ({ ...previous, teams: [...previous.teams, { id, name: draft.name.trim(), discipline: "Фиджитал-спорт", createdAt: new Date().toISOString(), members: draft.playerIds.map(userId => { const user = previous.users.find(item => item.id === userId)!; return { id: user.id, name: fullName(user), captain: user.id === draft.captainId } }) }] }));
    },
    createCaptainTeam: async name => {
      if (!signedInUser) throw new Error("Войдите в аккаунт, чтобы создать команду");
      if (signedInUser.role === "ADMIN") throw new Error("Администратор не может входить в игровой состав");
      if (!name.trim()) throw new Error("Введите название команды");
      if (state.teams.some(team => team.name.toLowerCase() === name.trim().toLowerCase())) throw new Error("Команда с таким названием уже существует");
      const team: Team = { id: crypto.randomUUID(), name: name.trim(), discipline: "Фиджитал-спорт", createdAt: new Date().toISOString(), members: [{ id: signedInUser.id, name: fullName(signedInUser), captain: true }] };
      await mutate(previous => withLog({ ...previous, teams: [...previous.teams, team] }, fullName(signedInUser), "Создание", "Команда", team.id, `Создана команда «${team.name}»`)); return team;
    },
    sendInvitation: async (teamId, recipientId) => {
      if (!signedInUser) throw new Error("Требуется авторизация");
      const team = state.teams.find(item => item.id === teamId), recipient = state.users.find(item => item.id === recipientId);
      if (!team || !recipient) throw new Error("Команда или пользователь не найдены");
      if (!team.members.some(member => member.id === signedInUser.id && member.captain)) throw new Error("Приглашения может отправлять только капитан");
      if (recipient.role === "ADMIN") throw new Error("Администратора нельзя добавить в игровой состав");
      if (team.members.some(member => member.id === recipientId)) throw new Error("Пользователь уже в составе");
      if (state.invitations.some(item => item.teamId === teamId && item.recipientId === recipientId && item.status === "pending")) throw new Error("Приглашение уже отправлено");
      const invitation: TeamInvitation = { id: crypto.randomUUID(), teamId, senderId: signedInUser.id, recipientId, status: "pending", createdAt: new Date().toISOString() };
      const notification: AppNotification = { id: crypto.randomUUID(), userId: recipientId, type: "team_invitation", invitationId: invitation.id, title: "Приглашение в команду", message: `${fullName(signedInUser)} приглашает вас присоединиться к команде ${team.name}.`, createdAt: invitation.createdAt, read: false };
      await mutate(previous => {
        const current = previous.teams.find(item => item.id === teamId);
        if (!current?.members.some(member => member.id === signedInUser.id && member.captain)) throw new Error("Приглашения может отправлять только текущий капитан");
        if (current.members.some(member => member.id === recipientId)) throw new Error("Пользователь уже в составе");
        if (!previous.users.some(item => item.id === recipientId && item.role !== "ADMIN")) throw new Error("Игрок недоступен");
        if (previous.invitations.some(item => item.teamId === teamId && item.recipientId === recipientId && item.status === "pending")) throw new Error("Приглашение уже отправлено");
        return withLog({ ...previous, invitations: [invitation, ...previous.invitations], notifications: [notification, ...previous.notifications] }, fullName(signedInUser), "Приглашение", "Команда", teamId, `Приглашён игрок ${fullName(recipient)}`);
      });
    },
    respondInvitation: async (invitationId, response) => {
      if (!signedInUser) throw new Error("Требуется авторизация");
      const invitation = state.invitations.find(item => item.id === invitationId);
      if (!invitation || invitation.status !== "pending") throw new Error("Приглашение уже обработано");
      if (invitation.recipientId !== signedInUser.id) throw new Error("Недостаточно прав");
      const team = state.teams.find(item => item.id === invitation.teamId); if (!team) throw new Error("Команда не найдена");
      const now = new Date().toISOString(), accepted = response === "accepted", verb = accepted ? "принял(а)" : "отклонил(а)";
      const result: AppNotification = { id: crypto.randomUUID(), userId: invitation.senderId, type: "invitation_result", invitationId, title: "Ответ на приглашение", message: `${fullName(signedInUser)} ${verb} приглашение в команду ${team.name}.`, createdAt: now, read: false };
      const self: AppNotification | null = accepted ? { id: crypto.randomUUID(), userId: signedInUser.id, type: "system", title: "Вы в команде", message: `Вы присоединились к команде ${team.name}.`, createdAt: now, read: false } : null;
      await mutate(previous => {
        const current = previous.invitations.find(item => item.id === invitationId);
        if (!current || current.status !== "pending" || current.recipientId !== signedInUser.id) throw new Error("Приглашение уже обработано или недоступно");
        if (!previous.teams.some(item => item.id === current.teamId)) throw new Error("Команда не найдена");
        const teams = accepted ? previous.teams.map(item => item.id === team.id && !item.members.some(member => member.id === signedInUser.id) ? { ...item, updatedAt: now, members: [...item.members, { id: signedInUser.id, name: fullName(signedInUser) }] } : item) : previous.teams;
        const invitations = previous.invitations.map(item => item.id === invitationId ? { ...item, status: response as InvitationStatus, respondedAt: now } : item);
        const notifications = [result, ...(self ? [self] : []), ...previous.notifications.map(item => item.invitationId === invitationId && item.userId === signedInUser.id ? { ...item, read: true } : item)];
        return withLog({ ...previous, teams, invitations, notifications }, fullName(signedInUser), accepted ? "Принятие" : "Отклонение", "Приглашение", invitationId, `${accepted ? "Принято" : "Отклонено"} приглашение в «${team.name}»`);
      });
    },
    cancelInvitation: async invitationId => { if (!signedInUser) throw new Error("Требуется авторизация"); const invitation = state.invitations.find(item => item.id === invitationId); const team = state.teams.find(item => item.id === invitation?.teamId); if (!invitation || invitation.status !== "pending" || !team?.members.some(member => member.id === signedInUser.id && member.captain)) throw new Error("Приглашение может отменить только текущий капитан"); await mutate(previous => withLog({ ...previous, invitations: previous.invitations.map(item => item.id === invitationId ? { ...item, status: "cancelled", respondedAt: new Date().toISOString() } : item), notifications: previous.notifications.map(item => item.invitationId === invitationId ? { ...item, read: true } : item) }, fullName(signedInUser), "Отмена", "Приглашение", invitationId, "Приглашение отменено капитаном")) },
    markNotificationsRead: () => { if (!signedInUser) return; void mutate(previous => ({ ...previous, notifications: previous.notifications.map(item => item.userId === signedInUser.id ? { ...item, read: true } : item) })).catch(() => setStorageError("Не удалось отметить уведомления прочитанными")) },
    submitTournamentApplication: async (teamId, tournamentId, additionalInfo) => {
      if (!signedInUser) throw new Error("Требуется авторизация");
      const team=state.teams.find(item=>item.id===teamId),tournament=state.tournaments.find(item=>item.id===tournamentId);
      if(!team||!tournament)throw new Error("Команда или турнир не найдены");
      if(!team.members.some(member=>member.id===signedInUser.id&&member.captain))throw new Error("Подать заявку может только капитан команды");
      if(additionalInfo.length>500)throw new Error("Дополнительная информация не должна превышать 500 символов");
      if(state.tournamentApplications.some(item=>item.teamId===teamId&&item.tournamentId===tournamentId&&item.status!=="REJECTED"))throw new Error("Заявка этой команды уже отправлена");
      const id=crypto.randomUUID(),application={id,teamId,tournamentId,captainName:fullName(signedInUser),additionalInfo:additionalInfo.trim(),status:"NEW" as const,createdAt:new Date().toISOString()};
      await mutate(previous=>withLog({...previous,tournamentApplications:[application,...previous.tournamentApplications]},fullName(signedInUser),"Создание","Заявка на турнир",id,`Подана заявка команды «${team.name}» на «${tournament.name}»`));
    },
    updateTeam: (id, patch) => commitTeam(id, "Изменение", "Изменено название команды", previous => {
      const name = patch.name?.trim();
        if (!name) throw new Error("Введите название команды");
        if (name.length > 80) throw new Error("Название команды не должно превышать 80 символов");
      if (!previous.teams.some(team => team.id === id)) throw new Error("Команда не найдена");
      if (previous.teams.some(team => team.id !== id && team.name.toLowerCase() === name.toLowerCase())) throw new Error("Команда с таким названием уже существует");
      return { ...previous, teams: previous.teams.map(team => team.id === id ? { ...team, name, updatedAt: new Date().toISOString() } : team) };
    }),
    addTeamMember: (teamId, userId) => { if (userId === signedInUser?.id) return Promise.reject(new Error("Администратор не может добавить себя в команду")); const user = state.users.find(item => item.id === userId), team = state.teams.find(item => item.id === teamId); if (user?.role==="ADMIN") return Promise.reject(new Error("Администратора нельзя добавить в игровой состав")); if (!user || !team) return Promise.reject(new Error("Пользователь или команда не найдены")); if (team.members.some(member => member.id === userId)) return Promise.reject(new Error("Пользователь уже состоит в команде")); return commitAdmin("Изменение", "Команда", teamId, `Добавлен участник ${fullName(user)}`, previous => ({ ...previous, teams: previous.teams.map(item => item.id === teamId ? { ...item, updatedAt: new Date().toISOString(), members: [...item.members, { id: user.id, name: fullName(user) }] } : item) })) },
    removeTeamMember: (teamId, userId) => {
      const member = state.teams.find(team => team.id === teamId)?.members.find(item => item.id === userId);
      if (!member) return Promise.reject(new Error("Участник не найден"));
      if (member.captain) return Promise.reject(new Error("Сначала назначьте другого капитана"));
      return commitTeam(teamId, "Изменение", `Удалён участник ${member.name}`, previous => {
        const currentMember = previous.teams.find(team => team.id === teamId)?.members.find(item => item.id === userId);
        if (!currentMember) throw new Error("Участник не найден");
        if (currentMember.captain) throw new Error("Сначала назначьте другого капитана");
        return { ...previous, teams: previous.teams.map(team => team.id === teamId ? { ...team, updatedAt: new Date().toISOString(), members: team.members.filter(item => item.id !== userId) } : team) };
      });
    },
    assignCaptain: (teamId, userId) => {
      const member = state.teams.find(team => team.id === teamId)?.members.find(item => item.id === userId);
      if (!member) return Promise.reject(new Error("Капитан должен быть участником команды"));
      return commitTeam(teamId, "Изменение", `Капитаном назначен ${member.name}`, previous => {
        if (!previous.teams.find(team => team.id === teamId)?.members.some(item => item.id === userId)) throw new Error("Капитан должен быть участником команды");
        return { ...previous, teams: previous.teams.map(team => team.id === teamId ? { ...team, updatedAt: new Date().toISOString(), members: team.members.map(item => ({ ...item, captain: item.id === userId })) } : team) };
      });
    },
    leaveTeam: async teamId => {
      if (!signedInUser) throw new Error("Войдите в аккаунт");
      await mutate(previous => {
        const team = previous.teams.find(item => item.id === teamId);
        if (!team) throw new Error("Команда не найдена");
        const member = team.members.find(item => item.id === signedInUser.id);
        if (!member) throw new Error("Вы не состоите в этой команде");
        if (member.captain) throw new Error("Сначала передайте права капитана или удалите команду");
        return withLog({ ...previous, teams: previous.teams.map(item => item.id === teamId ? { ...item, members: item.members.filter(player => player.id !== signedInUser.id), updatedAt: new Date().toISOString() } : item) }, fullName(signedInUser), "Выход", "Команда", teamId, `${fullName(signedInUser)} покинул команду`);
      });
    },
    deleteTeam: id => commitTeam(id, "Удаление", "Команда удалена", previous => ({ ...previous, teams: previous.teams.filter(team => team.id !== id), invitations: previous.invitations.map(item => item.teamId === id && item.status === "pending" ? { ...item, status: "cancelled", respondedAt: new Date().toISOString() } : item), notifications: previous.notifications.map(item => previous.invitations.some(invite => invite.teamId === id && invite.id === item.invitationId) ? { ...item, read: true } : item), tournamentApplications: previous.tournamentApplications.filter(item => item.teamId !== id) })),
    updateTeamApplication: (id, status) => commitAdmin(status === "APPROVED" ? "Одобрение" : "Отклонение", "Заявка на команду", id, `Статус заявки изменён на ${status}`, previous => ({ ...previous, teamApplications: previous.teamApplications.map(application => application.id === id ? { ...application, status } : application) })),
    createTournament: draft => { if (!draft.name.trim() || !draft.shortDescription.trim() || !draft.city.trim() || !draft.startAt || !draft.endAt) return Promise.reject(new Error("Заполните обязательные поля")); if(draft.shortDescription.length>500) return Promise.reject(new Error("Краткое описание не должно превышать 500 символов")); if(!Number.isFinite(Date.parse(draft.startAt))||!Number.isFinite(Date.parse(draft.endAt))) return Promise.reject(new Error("Укажите корректные даты")); if (new Date(draft.endAt) <= new Date(draft.startAt)) return Promise.reject(new Error("Окончание должно быть позднее начала")); const id = `${draft.name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-")}-${Date.now()}`; return commitAdmin("Создание", "Турнир", id, `Создан турнир «${draft.name}»`, previous => ({ ...previous, tournaments: [...previous.tournaments, { id, publicNumber: "", name: draft.name.trim(), discipline: "", format: "", city: draft.city.trim(), venue: "", shortDescription: draft.shortDescription.trim(), description: draft.fullDescription?.trim() || draft.shortDescription.trim(), startAt: draft.startAt, endAt: draft.endAt ?? "", registrationEndsAt: draft.startAt, rules: [], imageName: draft.imageName, imageUrl: draft.imageUrl }] })) },
    updateTournament: (id, patch) => commitAdmin("Изменение", "Турнир", id, "Обновлены данные турнира", previous => {
      const existing = previous.tournaments.find(item => item.id === id);
      if (!existing) throw new Error("Турнир не найден");
      const next = { ...existing, ...patch };
      if (!next.name.trim() || !next.shortDescription.trim() || !next.city.trim() || !next.startAt || !next.endAt) throw new Error("Заполните обязательные поля");
      if (next.shortDescription.length > 500) throw new Error("Краткое описание не должно превышать 500 символов");
      if (!Number.isFinite(Date.parse(next.startAt)) || !Number.isFinite(Date.parse(next.endAt))) throw new Error("Укажите корректные даты");
      if (new Date(next.endAt) <= new Date(next.startAt)) throw new Error("Окончание должно быть позднее начала");
      return { ...previous, tournaments: previous.tournaments.map(item => item.id === id ? { ...next, name: next.name.trim(), city: next.city.trim(), shortDescription: next.shortDescription.trim() } : item) };
    }),
    deleteTournament: id => commitAdmin("Удаление", "Турнир", id, "Турнир и связанные заявки удалены", previous => {
      if (!previous.tournaments.some(item => item.id === id)) throw new Error("Турнир не найден");
      return { ...previous, tournaments: previous.tournaments.filter(tournament => tournament.id !== id), tournamentApplications: previous.tournamentApplications.filter(item => item.tournamentId !== id) };
    }),
    updateTournamentApplication: (id, status) => commitAdmin(status === "APPROVED" ? "Одобрение" : "Отклонение", "Заявка на турнир", id, `Статус заявки изменён на ${status}`, previous => ({ ...previous, tournamentApplications: previous.tournamentApplications.map(application => application.id === id ? { ...application, status } : application) })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [signedInUser, state]);

  return <AdminContext.Provider value={actions}>{storageError&&<p className="storage-error" role="alert">{storageError}</p>}{children}</AdminContext.Provider>;
}

export function useAdminStore() { const value = useContext(AdminContext); if (!value) throw new Error("useAdminStore requires AdminStoreProvider"); return value }
