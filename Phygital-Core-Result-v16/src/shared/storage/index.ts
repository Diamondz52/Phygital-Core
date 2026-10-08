const DB = "phygital-core-demo", STORE = "records", EVENT = "phygital:record-changed";
function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("Локальное хранилище недоступно"));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Не удалось открыть хранилище"));
  });
}
function announce(key: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
  if (typeof BroadcastChannel !== "undefined") { const channel = new BroadcastChannel(EVENT); channel.postMessage(key); channel.close(); }
}
export function subscribeRecord(key: string, listener: () => void) {
  const onChange = (event: Event) => { if ((event as CustomEvent<string>).detail === key) listener(); };
  window.addEventListener(EVENT, onChange);
  const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(EVENT) : null;
  if (channel) channel.onmessage = event => { if (event.data === key) listener(); };
  return () => { window.removeEventListener(EVENT, onChange); channel?.close(); };
}
export async function loadRecord<T>(key: string, fallback: T): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE), request = transaction.objectStore(STORE).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? fallback);
    request.onerror = () => reject(new Error("Не удалось прочитать локальные данные"));
    transaction.oncomplete = () => database.close();
    transaction.onabort = () => { database.close(); reject(new Error("Чтение данных прервано")); };
  });
}
/** Read-modify-write in one transaction: concurrent tabs cannot overwrite each other. */
export async function updateRecord<T>(key: string, fallback: T, change: (value: T) => T): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, "readwrite"), store = transaction.objectStore(STORE);
    const request = store.get(key); let next: T; let failure: unknown;
    request.onsuccess = () => { try { next = change((request.result as T | undefined) ?? fallback); store.put(next, key); } catch (error) { failure = error; transaction.abort(); } };
    transaction.oncomplete = () => { database.close(); announce(key); resolve(next); };
    transaction.onabort = transaction.onerror = () => { database.close(); reject(failure ?? new Error("Не удалось сохранить данные. Проверьте доступ к хранилищу.")); };
  });
}
