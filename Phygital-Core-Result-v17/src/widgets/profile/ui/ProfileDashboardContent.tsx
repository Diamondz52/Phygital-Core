"use client";

import { Button } from "@/shared/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CalendarDays, LogOut, Mail, ShieldCheck, Smartphone, UsersRound } from "lucide-react";
import { type Team } from "@/entities/team";
import { usePlatformStore } from "@/entities/platform";
import { useAuth } from "@/entities/user";
import { NotificationCenter } from "@/features/respond-team-invitation";
import { useApp } from "@/shared/providers";

import { EditProfileForm } from "@/features/edit-profile";
import { ChangePasswordForm } from "@/features/change-password";

export function ProfileDashboardContent({
  renderTeamDialog,
}: {
  renderTeamDialog: (team: Team, close: () => void) => ReactNode;
}) {
  const { user, logout } = useAuth();
  const { state } = usePlatformStore();
  const { notify } = useApp();
  const router = useRouter();
  const [clockNow] = useState(() => Date.now());
  const [tab, setTab] = useState<"overview" | "profile" | "security">("overview"),
    [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  if (!user) return null;
  const liveTeam = state.teams.find((team) => team.id === selectedTeam?.id) ?? null;
  const nearest = state.tournaments
    .filter((tournament) => new Date(tournament.endAt).getTime() >= clockNow)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  const userTeams = state.teams.filter((team) =>
    team.members.some((member) => member.id === user.id),
  );
  const signOut = async () => {
    await logout();
    notify("Вы вышли из аккаунта");
    router.push("/");
  };
  return (
    <>
      <div className="profile-top-tools">
        <NotificationCenter />
      </div>
      <section className="content-section profile-dashboard">
        <aside className="profile-nav glass">
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>
            Обзор
          </button>
          <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>
            Личные данные
          </button>
          <button className={tab === "security" ? "active" : ""} onClick={() => setTab("security")}>
            Безопасность
          </button>
          {user.role === "ADMIN" && (
            <Link href="/admin">
              <ShieldCheck />
              Админ-панель
            </Link>
          )}
          <button className="logout-link" onClick={signOut}>
            <LogOut />
            Выйти
          </button>
        </aside>
        <div className="profile-workspace">
          {tab === "overview" && (
            <>
              <div className="profile-kpis">
                <article className="glass">
                  <UsersRound />
                  <small>Мои команды</small>
                  <b>{user.role === "ADMIN" ? "—" : userTeams.length}</b>
                </article>
                <article className="glass">
                  <CalendarDays />
                  <small>Ближайший турнир</small>
                  <b>
                    {nearest
                      ? new Date(nearest.startAt).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "short",
                        })
                      : "Нет турниров"}
                  </b>
                </article>
                <article className="glass">
                  <ShieldCheck />
                  <small>Статус аккаунта</small>
                  <b>Активен</b>
                </article>
              </div>
              <div className="profile-overview-grid">
                <article className="glass profile-summary">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">ПРОФИЛЬ</p>
                      <h2>
                        {user.firstName} {user.lastName}
                      </h2>
                    </div>
                    <Button
                      variant="secondary"
                      className="secondary"
                      onClick={() => setTab("profile")}
                    >
                      Редактировать
                    </Button>
                  </div>
                  <p>{user.bio || "Добавьте пару слов о себе и своих спортивных интересах."}</p>
                  <div className="profile-contact">
                    <span>
                      <Mail />
                      {user.email}
                    </span>
                    <span>
                      <Smartphone />
                      {user.phone || "Телефон не указан"}
                    </span>
                  </div>
                </article>
                <article className="glass profile-teams">
                  <p className="eyebrow">КОМАНДЫ</p>
                  <h2>{user.role === "ADMIN" ? "Организация" : "Мои команды"}</h2>
                  {user.role === "ADMIN" ? (
                    <p>У вас есть доступ к управлению всеми командами платформы.</p>
                  ) : userTeams.length ? (
                    userTeams.map((team) => (
                      <button key={team.id} onClick={() => setSelectedTeam(team)}>
                        <span className="team-logo">{team.name.slice(0, 2).toUpperCase()}</span>
                        <b>{team.name}</b>
                        <small>
                          {team.members.find((member) => member.captain)?.id === user.id
                            ? "Капитан"
                            : "Участник"}
                        </small>
                        <i>→</i>
                      </button>
                    ))
                  ) : (
                    <p>После принятия приглашения команда появится здесь.</p>
                  )}
                </article>
              </div>
            </>
          )}
          {/* Independent profile and security actions use the same existing visual forms. */}
          {tab === "profile" && (
            <EditProfileForm
              onSaved={() => setTab("overview")}
              onCancel={() => setTab("overview")}
            />
          )}
          {tab === "security" && (
            <ChangePasswordForm
              onSaved={() => setTab("overview")}
              onCancel={() => setTab("overview")}
            />
          )}
        </div>
      </section>
      {liveTeam && renderTeamDialog(liveTeam, () => setSelectedTeam(null))}
    </>
  );
}
