import { type PlatformActions } from "../model/types";

import { type ActionContext } from "./actionContext";
// Domain operations share one permission and atomic storage boundary.
export function createNotificationActions(
  context: ActionContext,
): Pick<PlatformActions, "markNotificationsRead"> {
  const { signedInUser, mutate, setStorageError } = context;
  return {
    markNotificationsRead: () => {
      if (!signedInUser) return;
      void mutate((previous) => ({
        ...previous,
        notifications: previous.notifications.map((item) =>
          item.userId === signedInUser.id ? { ...item, read: true } : item,
        ),
      })).catch(() => setStorageError("Не удалось отметить уведомления прочитанными"));
    },
  };
}
