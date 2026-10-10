import { type User, type authService } from "@/entities/user/@x/platform";

import { type PlatformState, type PlatformActions } from "../model/types";

import { createActionContext } from "./actionContext";
import { createUserActions } from "./userActions";
import { createTeamActions } from "./teamActions";
import { createInvitationActions } from "./invitationActions";
import { createNotificationActions } from "./notificationActions";
import { createTournamentActions } from "./tournamentActions";
export function createPlatformActions(
  state: PlatformState,
  signedInUser: User | null,
  accountService: typeof authService,
  mutate: (change: (previous: PlatformState) => PlatformState) => Promise<void>,
  setStorageError: (message: string) => void = () => {},
): PlatformActions {
  const context = createActionContext(state, signedInUser, accountService, mutate, setStorageError);
  return {
    state,
    ...createUserActions(context),
    ...createTeamActions(context),
    ...createInvitationActions(context),
    ...createNotificationActions(context),
    ...createTournamentActions(context),
  };
}
