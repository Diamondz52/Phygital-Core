import { users as seedUsers } from "@/entities/user/@x/platform";
import { teams as seedTeams } from "@/entities/team/@x/platform";
import { tournaments as seedTournaments } from "@/entities/tournament/@x/platform";
import { tournamentApplications as seedTournamentApplications } from "@/entities/tournament-application/@x/platform";
import { logs as seedLogs } from "@/entities/admin-log/@x/platform";
import { type PlatformState } from "./types";

export const initialState: PlatformState = {
  users: seedUsers,
  teams: seedTeams,
  tournaments: seedTournaments,
  tournamentApplications: seedTournamentApplications,
  logs: seedLogs,
  invitations: [],
  notifications: [],
  feedback: [],
};
