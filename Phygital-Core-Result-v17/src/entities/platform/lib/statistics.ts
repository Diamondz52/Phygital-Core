import { type PlatformState } from "../model/types";
export type Period = "today" | "7d" | "30d" | "month" | "year" | "custom";
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const safeDate = (value?: string) => {
  if (!value) return null;
  const match = value.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const inRange = (value: string | undefined, start: Date, end: Date) => {
  const date = safeDate(value);
  return Boolean(date && date >= start && date <= end);
};

// Inclusive local-calendar boundaries keep controls, totals and chart in agreement.
export function getStatisticsRange(period: Period, from = "", to = "", now = new Date()) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start = startOfDay(now);
  if (period === "7d") start.setDate(start.getDate() - 6);
  if (period === "30d") start.setDate(start.getDate() - 29);
  if (period === "month") start = new Date(now.getFullYear(), now.getMonth(), 1);
  if (period === "year") start = new Date(now.getFullYear(), 0, 1);
  if (period === "custom") {
    start = from ? startOfDay(new Date(`${from}T00:00:00`)) : start;
    const customEnd = to ? new Date(`${to}T23:59:59`) : end;
    return { start, end: customEnd };
  }
  return { start, end };
}
type Range = ReturnType<typeof getStatisticsRange>;
export function getStatisticsMetrics(state: PlatformState, range: Range) {
  return {
    users: state.users.filter((item) => inRange(item.createdAt, range.start, range.end)).length,
    teams: state.teams.filter((item) => inRange(item.createdAt, range.start, range.end)).length,
    tournaments: state.tournaments.filter((item) => inRange(item.startAt, range.start, range.end))
      .length,
    applications: state.tournamentApplications.filter((item) =>
      inRange(item.createdAt, range.start, range.end),
    ).length,
    approved: state.tournamentApplications.filter(
      (item) => item.status === "APPROVED" && inRange(item.createdAt, range.start, range.end),
    ).length,
    invitations: state.invitations.filter((item) => inRange(item.createdAt, range.start, range.end))
      .length,
    feedback: state.feedback.filter((item) => inRange(item.createdAt, range.start, range.end))
      .length,
    activity: state.logs.filter((item) => inRange(item.date, range.start, range.end)).length,
  };
}
export function getStatisticsChart(state: PlatformState, range: Range) {
  const span = Math.max(1, Math.ceil((range.end.getTime() - range.start.getTime()) / 86400000)),
    step = Math.max(1, Math.ceil(span / 31)),
    bins = Math.ceil(span / step);
  return Array.from({ length: bins }, (_, index) => {
    const day = new Date(range.start);
    day.setDate(day.getDate() + index * step);
    const end = new Date(day);
    end.setDate(end.getDate() + step);
    end.setMilliseconds(-1);
    const same = (value?: string) =>
      inRange(value, day, new Date(Math.min(end.getTime(), range.end.getTime())));
    return {
      d: day.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }),
      users: state.users.filter((item) => same(item.createdAt)).length,
      teams: state.teams.filter((item) => same(item.createdAt)).length,
      invitations: state.invitations.filter((item) => same(item.createdAt)).length,
      feedback: state.feedback.filter((item) => same(item.createdAt)).length,
      activity: state.logs.filter((item) => same(item.date)).length,
    };
  });
}
