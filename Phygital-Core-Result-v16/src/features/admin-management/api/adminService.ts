import { loadRecord, subscribeRecord, updateRecord } from "@/shared/storage";
import { PLATFORM_STORAGE_KEY } from "@/shared/config";
import type { AdminState } from "../model/AdminStore";

export const adminService = {
  async getState(fallback: AdminState) {
    return { ...fallback, ...await loadRecord<Partial<AdminState>>(PLATFORM_STORAGE_KEY, {}) };
  },
  updateState(change: (state: AdminState) => AdminState, fallback: AdminState) {
    return updateRecord<AdminState>(PLATFORM_STORAGE_KEY, fallback, previous => change({ ...fallback, ...previous }));
  },
  subscribe(listener: () => void) { return subscribeRecord(PLATFORM_STORAGE_KEY, listener); },
};
