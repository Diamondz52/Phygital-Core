export type UserRole="USER"|"ADMIN"; export type Status="NEW"|"APPROVED"|"REJECTED";
export interface User{id:string;firstName:string;lastName:string;email:string;phone:string;telegram:string;birthDate:string;role:UserRole;bio?:string;avatar?:string;createdAt?:string}
export interface TeamMember{id:string;name:string;captain?:boolean} export interface Team{id:string;name:string;discipline:string;members:TeamMember[];createdAt?:string;updatedAt?:string}
export interface TeamApplication{id:string;proposedName:string;captainName:string;membersText:string;status:Status;createdAt:string}
export interface Tournament{id:string;publicNumber:string;name:string;discipline:string;format:string;city:string;venue:string;shortDescription:string;description:string;startAt:string;endAt:string;registrationEndsAt:string;rules:string[];imageName?:string;imageUrl?:string}
export interface TournamentApplication{id:string;teamId:string;tournamentId:string;captainName:string;additionalInfo:string;status:Status;createdAt:string}
export interface AdminLog{id:string;date:string;admin:string;action:string;entityType:string;entityId:string;details:string}
export type InvitationStatus="pending"|"accepted"|"declined"|"cancelled";
export interface TeamInvitation{id:string;teamId:string;senderId:string;recipientId:string;status:InvitationStatus;createdAt:string;respondedAt?:string}
export type NotificationType="team_invitation"|"invitation_result"|"system";
export interface AppNotification{id:string;userId:string;type:NotificationType;title:string;message:string;createdAt:string;read:boolean;invitationId?:string}
