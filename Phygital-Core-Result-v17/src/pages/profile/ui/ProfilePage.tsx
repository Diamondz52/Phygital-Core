"use client";

import { ProtectedGate } from "@/features/auth";
import { PageHeader } from "@/widgets/page-header";
import { ProfileDashboardContent } from "@/widgets/profile";
import { TeamDialog } from "@/widgets/team-dialog";
export function ProfilePage() {
  return (
    <ProtectedGate>
      <PageHeader
        eyebrow="ЛИЧНОЕ ПРОСТРАНСТВО"
        title="Личный кабинет"
        description="Профиль, команды и настройки безопасности."
      />
      <ProfileDashboardContent
        renderTeamDialog={(team, close) => <TeamDialog team={team} close={close} />}
      />
    </ProtectedGate>
  );
}
