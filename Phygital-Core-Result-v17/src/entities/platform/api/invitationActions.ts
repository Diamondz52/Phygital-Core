import { type TeamInvitation } from "@/entities/team-invitation/@x/platform";
import { type AppNotification } from "@/entities/notification/@x/platform";
import { type PlatformActions } from "../model/types";
import { type InvitationStatus } from "@/entities/team-invitation/@x/platform";
import { type ActionContext } from "./actionContext";
// Domain operations share one permission and atomic storage boundary.
export function createInvitationActions(
  context: ActionContext,
): Pick<PlatformActions, "sendInvitation" | "respondInvitation" | "cancelInvitation"> {
  const { state, signedInUser, mutate, withLog, fullName } = context;
  return {
    sendInvitation: async (teamId, recipientId) => {
      if (!signedInUser) throw new Error("Требуется авторизация");
      const team = state.teams.find((item) => item.id === teamId),
        recipient = state.users.find((item) => item.id === recipientId);
      if (!team || !recipient) throw new Error("Команда или пользователь не найдены");
      if (!team.members.some((member) => member.id === signedInUser.id && member.captain))
        throw new Error("Приглашения может отправлять только капитан");
      if (recipient.role === "ADMIN")
        throw new Error("Администратора нельзя добавить в игровой состав");
      if (team.members.some((member) => member.id === recipientId))
        throw new Error("Пользователь уже в составе");
      if (
        state.invitations.some(
          (item) =>
            item.teamId === teamId && item.recipientId === recipientId && item.status === "pending",
        )
      )
        throw new Error("Приглашение уже отправлено");
      const invitation: TeamInvitation = {
        id: crypto.randomUUID(),
        teamId,
        senderId: signedInUser.id,
        recipientId,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      const notification: AppNotification = {
        id: crypto.randomUUID(),
        userId: recipientId,
        type: "team_invitation",
        invitationId: invitation.id,
        title: "Приглашение в команду",
        message: `${fullName(signedInUser)} приглашает вас присоединиться к команде ${team.name}.`,
        createdAt: invitation.createdAt,
        read: false,
      };
      await mutate((previous) => {
        const current = previous.teams.find((item) => item.id === teamId);
        if (!current?.members.some((member) => member.id === signedInUser.id && member.captain))
          throw new Error("Приглашения может отправлять только текущий капитан");
        if (current.members.some((member) => member.id === recipientId))
          throw new Error("Пользователь уже в составе");
        if (!previous.users.some((item) => item.id === recipientId && item.role !== "ADMIN"))
          throw new Error("Игрок недоступен");
        if (
          previous.invitations.some(
            (item) =>
              item.teamId === teamId &&
              item.recipientId === recipientId &&
              item.status === "pending",
          )
        )
          throw new Error("Приглашение уже отправлено");
        return withLog(
          {
            ...previous,
            invitations: [invitation, ...previous.invitations],
            notifications: [notification, ...previous.notifications],
          },
          fullName(signedInUser),
          "Приглашение",
          "Команда",
          teamId,
          `Приглашён игрок ${fullName(recipient)}`,
        );
      });
    },
    respondInvitation: async (invitationId, response) => {
      if (!signedInUser) throw new Error("Требуется авторизация");
      const invitation = state.invitations.find((item) => item.id === invitationId);
      if (!invitation || invitation.status !== "pending")
        throw new Error("Приглашение уже обработано");
      if (invitation.recipientId !== signedInUser.id) throw new Error("Недостаточно прав");
      const team = state.teams.find((item) => item.id === invitation.teamId);
      if (!team) throw new Error("Команда не найдена");
      const now = new Date().toISOString(),
        accepted = response === "accepted",
        verb = accepted ? "принял(а)" : "отклонил(а)";
      const result: AppNotification = {
        id: crypto.randomUUID(),
        userId: invitation.senderId,
        type: "invitation_result",
        invitationId,
        title: "Ответ на приглашение",
        message: `${fullName(signedInUser)} ${verb} приглашение в команду ${team.name}.`,
        createdAt: now,
        read: false,
      };
      const self: AppNotification | null = accepted
        ? {
            id: crypto.randomUUID(),
            userId: signedInUser.id,
            type: "system",
            title: "Вы в команде",
            message: `Вы присоединились к команде ${team.name}.`,
            createdAt: now,
            read: false,
          }
        : null;
      await mutate((previous) => {
        const current = previous.invitations.find((item) => item.id === invitationId);
        if (!current || current.status !== "pending" || current.recipientId !== signedInUser.id)
          throw new Error("Приглашение уже обработано или недоступно");
        if (!previous.teams.some((item) => item.id === current.teamId))
          throw new Error("Команда не найдена");
        // Состав и результат приглашения меняются в одной транзакции:
        // отправка приглашения сама по себе не добавляет игрока в команду.
        const teams = accepted
          ? previous.teams.map((item) =>
              item.id === team.id && !item.members.some((member) => member.id === signedInUser.id)
                ? {
                    ...item,
                    updatedAt: now,
                    members: [
                      ...item.members,
                      { id: signedInUser.id, name: fullName(signedInUser) },
                    ],
                  }
                : item,
            )
          : previous.teams;
        const invitations = previous.invitations.map((item) =>
          item.id === invitationId
            ? { ...item, status: response as InvitationStatus, respondedAt: now }
            : item,
        );
        const notifications = [
          result,
          ...(self ? [self] : []),
          ...previous.notifications.map((item) =>
            item.invitationId === invitationId && item.userId === signedInUser.id
              ? { ...item, read: true }
              : item,
          ),
        ];
        return withLog(
          { ...previous, teams, invitations, notifications },
          fullName(signedInUser),
          accepted ? "Принятие" : "Отклонение",
          "Приглашение",
          invitationId,
          `${accepted ? "Принято" : "Отклонено"} приглашение в «${team.name}»`,
        );
      });
    },
    cancelInvitation: async (invitationId) => {
      if (!signedInUser) throw new Error("Требуется авторизация");
      const invitation = state.invitations.find((item) => item.id === invitationId);
      const team = state.teams.find((item) => item.id === invitation?.teamId);
      if (
        !invitation ||
        invitation.status !== "pending" ||
        !team?.members.some((member) => member.id === signedInUser.id && member.captain)
      )
        throw new Error("Приглашение может отменить только текущий капитан");
      await mutate((previous) =>
        withLog(
          {
            ...previous,
            invitations: previous.invitations.map((item) =>
              item.id === invitationId
                ? { ...item, status: "cancelled", respondedAt: new Date().toISOString() }
                : item,
            ),
            notifications: previous.notifications.map((item) =>
              item.invitationId === invitationId ? { ...item, read: true } : item,
            ),
          },
          fullName(signedInUser),
          "Отмена",
          "Приглашение",
          invitationId,
          "Приглашение отменено капитаном",
        ),
      );
    },
  };
}
