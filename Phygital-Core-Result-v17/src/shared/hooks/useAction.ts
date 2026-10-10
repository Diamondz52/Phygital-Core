import { useRef, useState } from "react";
import { useApp } from "@/shared/providers";
export function useAction() {
  const { notify } = useApp();
  const [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const lock = useRef(false);
  const run = async (
    key: string,
    action: () => Promise<void>,
    success: string,
  ): Promise<boolean> => {
    if (lock.current) return false;
    lock.current = true;
    setBusy(key);
    setError("");
    try {
      await action();
      notify(success);
      return true;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Не удалось выполнить действие";
      setError(message);
      notify("Ошибка: " + message);
      return false;
    } finally {
      lock.current = false;
      setBusy("");
    }
  };
  return { busy, error, run };
}
