export type Status = "NEW" | "APPROVED" | "REJECTED";
export interface TournamentApplication {
  id: string;
  teamId: string;
  tournamentId: string;
  captainName: string;
  additionalInfo: string;
  status: Status;
  createdAt: string;
}
