export type InvitationStatus = "pending" | "accepted" | "declined" | "cancelled";
export interface TeamInvitation {
  id: string;
  teamId: string;
  senderId: string;
  recipientId: string;
  status: InvitationStatus;
  createdAt: string;
  respondedAt?: string;
}
