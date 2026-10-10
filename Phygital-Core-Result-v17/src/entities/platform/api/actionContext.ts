import { type User, type authService } from "@/entities/user/@x/platform";

import { type PlatformState } from "../model/types";

const fullName = (user: Pick<User, "firstName" | "lastName">) =>
  `${user.firstName} ${user.lastName}`.trim();

// All mutations retain the existing role checks and atomic persistence boundary.

export function createActionContext(
  state: PlatformState,
  signedInUser: User | null,
  accountService: typeof authService,
  mutate: (change: (previous: PlatformState) => PlatformState) => Promise<void>,
  setStorageError: (message: string) => void = () => {},
) {
  const requireAdmin = () => {
    if (signedInUser?.role !== "ADMIN")
      throw new Error("Недостаточно прав для выполнения действия");
  };
  const withLog = (
    previous: PlatformState,
    actor: string,
    action: string,
    entityType: string,
    entityId: string,
    details: string,
  ) => ({
    ...previous,
    logs: [
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        admin: actor,
        action,
        entityType,
        entityId,
        details,
      },
      ...previous.logs,
    ],
  });
  const commitAdmin = async (
    action: string,
    entityType: string,
    entityId: string,
    details: string,
    change: (previous: PlatformState) => PlatformState,
  ) => {
    if (signedInUser?.role !== "ADMIN")
      throw new Error("Недостаточно прав для выполнения действия");
    await mutate((previous) =>
      withLog(change(previous), fullName(signedInUser), action, entityType, entityId, details),
    );
  };
  const commitTeam = async (
    teamId: string,
    action: string,
    details: string,
    change: (previous: PlatformState) => PlatformState,
  ) => {
    const team = state.teams.find((item) => item.id === teamId);
    if (!team) throw new Error("Команда не найдена");
    if (
      !signedInUser ||
      (signedInUser.role !== "ADMIN" &&
        !team.members.some((member) => member.id === signedInUser.id && member.captain))
    )
      throw new Error("Управлять командой может только капитан или администратор");
    await mutate((previous) => {
      const current = previous.teams.find((item) => item.id === teamId);
      if (!current) throw new Error("Команда не найдена");
      if (
        signedInUser.role !== "ADMIN" &&
        !current.members.some((member) => member.id === signedInUser.id && member.captain)
      )
        throw new Error("Управлять командой может только капитан или администратор");
      return withLog(change(previous), fullName(signedInUser), action, "Команда", teamId, details);
    });
  };
  return {
    state,
    signedInUser,
    accountService,
    mutate,
    setStorageError,
    requireAdmin,
    withLog,
    commitAdmin,
    commitTeam,
    fullName,
  };
}
export type ActionContext = ReturnType<typeof createActionContext>;
