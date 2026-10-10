import { loadRecord, subscribeRecord, updateRecord } from "@/shared/storage";
import { PLATFORM_STORAGE_KEY } from "@/shared/config";
import { type PlatformState } from "../model/types";

export const platformService = {
  async getState(fallback: PlatformState) {
    return normalizePlatformState(
      await loadRecord<Partial<PlatformState>>(PLATFORM_STORAGE_KEY, {}),
      fallback,
    );
  },
  updateState(change: (state: PlatformState) => PlatformState, fallback: PlatformState) {
    return updateRecord<PlatformState>(PLATFORM_STORAGE_KEY, fallback, (previous) =>
      normalizePlatformState(change(normalizePlatformState(previous, fallback)), fallback),
    );
  },
  subscribe(listener: () => void) {
    return subscribeRecord(PLATFORM_STORAGE_KEY, listener);
  },
};

export function normalizePlatformState(
  saved: Partial<PlatformState>,
  fallback: PlatformState,
): PlatformState {
  // Project only the current schema: legacy team-creation requests disappear,
  // while teams, invitations, notifications and tournament applications survive.
  return Object.fromEntries(
    Object.keys(fallback).map((key) => [
      key,
      saved[key as keyof PlatformState] ?? fallback[key as keyof PlatformState],
    ]),
  ) as unknown as PlatformState;
}
