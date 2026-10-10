import { type User, type RegisterPayload } from "@/entities/user/@x/platform";
import { type Team } from "@/entities/team/@x/platform";
import { type Tournament } from "@/entities/tournament/@x/platform";
import {
  type Status,
  type TournamentApplication,
} from "@/entities/tournament-application/@x/platform";
import { type TeamInvitation } from "@/entities/team-invitation/@x/platform";
import { type AppNotification } from "@/entities/notification/@x/platform";
import { type AdminLog } from "@/entities/admin-log/@x/platform";
import { type Feedback } from "@/entities/feedback/@x/platform";
export interface PlatformState {
  users: User[];
  teams: Team[];
  tournaments: Tournament[];
  tournamentApplications: TournamentApplication[];
  logs: AdminLog[];
  invitations: TeamInvitation[];
  notifications: AppNotification[];
  feedback: Feedback[];
}
export interface TeamDraft {
  name: string;
  playerIds: string[];
  captainId: string;
}
export interface TournamentDraft {
  name: string;
  shortDescription: string;
  fullDescription?: string;
  city: string;
  imageName?: string;
  imageUrl?: string;
  startAt: string;
  endAt?: string;
}
export interface PlatformActions {
  state: PlatformState;
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
  submitTournamentApplication: (
    teamId: string,
    tournamentId: string,
    additionalInfo: string,
  ) => Promise<void>;
  updateTeam: (id: string, patch: Partial<Pick<Team, "name">>) => Promise<void>;
  addTeamMember: (teamId: string, userId: string) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  leaveTeam: (teamId: string) => Promise<void>;
  assignCaptain: (teamId: string, userId: string) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  createTournament: (draft: TournamentDraft) => Promise<void>;
  updateTournament: (id: string, patch: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  updateTournamentApplication: (id: string, status: Status) => Promise<void>;
}
