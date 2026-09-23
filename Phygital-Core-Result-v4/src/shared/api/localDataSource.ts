export interface DataSource<T> {
  read(fallback: T): Promise<T>;
  write(value: T): Promise<void>;
  clear(): Promise<void>;
}

export function createLocalDataSource<T>(key: string): DataSource<T> {
  return {
    async read(fallback) {
      if (typeof window === "undefined") return fallback;
      try {
        const saved = window.localStorage.getItem(key);
        return saved ? (JSON.parse(saved) as T) : fallback;
      } catch {
        return fallback;
      }
    },
    async write(value) {
      if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
    },
    async clear() {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    },
  };
}
