import { type Status } from "../model/types";
export const statusText: Record<Status, string> = {
  NEW: "Новая",
  APPROVED: "Одобрена",
  REJECTED: "Отклонена",
};

export const statusTone: Record<Status, "blue" | "green" | "red"> = {
  NEW: "blue",
  APPROVED: "green",
  REJECTED: "red",
};
