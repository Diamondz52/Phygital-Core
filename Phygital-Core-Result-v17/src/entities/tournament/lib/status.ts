import { type Tournament } from "../model/types";

export function tournamentStatus(
  t: Tournament,
  now = new Date(),
): "upcoming" | "active" | "completed" {
  const start = new Date(t.startAt);
  if (start > now) return "upcoming";
  if (!t.endAt) return "active";
  return new Date(t.endAt) >= now ? "active" : "completed";
}
