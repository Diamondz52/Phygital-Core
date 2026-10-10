"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BellRing,
  Clock3,
  FileText,
  Trophy,
  UsersRound,
  UserRound,
  MessageSquareText,
} from "lucide-react";
import { usePlatformStore } from "@/entities/platform";

export const items = [
  ["/admin", "Статистика", BarChart3],
  ["/admin/users", "Пользователи", UserRound],
  ["/admin/teams", "Команды", UsersRound],
  ["/admin/invitations", "Приглашения", BellRing],
  ["/admin/tournaments", "Турниры", Trophy],
  ["/admin/tournament-applications", "Заявки на турниры", FileText],
  ["/admin/feedback", "Обращения", MessageSquareText],
  ["/admin/logs", "Логи", Clock3],
] as const;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    { state } = usePlatformStore(),
    unread = state.feedback.filter((item) => item.status === "new" && !item.viewedAt).length;
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <p>АДМИН-ПАНЕЛЬ</p>
        {items.map(([href, label, Icon]) => (
          <Link key={href} href={href} className={path === href ? "active" : ""}>
            <Icon />
            {label}
            {href === "/admin/feedback" && unread > 0 && (
              <span className="feedback-count">{unread}</span>
            )}
          </Link>
        ))}
        <Link href="/">← Вернуться на сайт</Link>
      </aside>
      <section className="admin-workspace">{children}</section>
    </div>
  );
}
