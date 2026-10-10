"use client";

import { useState } from "react";
import { type Team } from "@/entities/team";
import { useAuth } from "@/entities/user";
import { useApp } from "@/shared/providers";
import { TeamProfileModal } from "@/features/manage-team";
import { InvitePlayersModal } from "@/features/invite-player";
export function TeamDialog({ team, close }: { team: Team; close: () => void }) {
  const [inviting, setInviting] = useState(false);
  const { user } = useAuth(),
    { notify } = useApp();
  const captain = team.members.some((member) => member.id === user?.id && member.captain);
  return inviting && captain ? (
    <InvitePlayersModal team={team} close={() => setInviting(false)} notify={notify} />
  ) : (
    <TeamProfileModal team={team} close={close} invite={() => setInviting(true)} />
  );
}
