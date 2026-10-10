// One boundary for synchronous browser preferences and legacy auth storage.
// Writes propagate failures so services can report an unavailable storage device.
export const storageService = {
  get(key: string): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },
  set(key: string, value: string): void {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  },
  remove(key: string): void {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  },
};
