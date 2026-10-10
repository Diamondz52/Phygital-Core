export type NotificationType = "team_invitation" | "invitation_result" | "system";
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  invitationId?: string;
}
