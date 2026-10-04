import { loadRecord, saveRecord } from "@/shared/storage";
import type { AdminState } from "../model/AdminStore";

const STORAGE_KEY = "admin-state-v4";

export const adminService = {
  getState(fallback: AdminState) {
    return loadRecord(STORAGE_KEY, fallback);
  },
  saveState(state: AdminState) {
    return saveRecord(STORAGE_KEY, state);
  },
};
