export type UserRole="USER"|"ADMIN"; export type Status="NEW"|"APPROVED"|"REJECTED";
export interface User{id:string;firstName:string;lastName:string;email:string;phone:string;telegram:string;birthDate:string;role:UserRole;bio?:string;avatar?:string}
export interface TeamMember{id:string;name:string;captain?:boolean} export interface Team{id:string;name:string;discipline:string;members:TeamMember[]}
export interface TeamApplication{id:string;proposedName:string;captainName:string;membersText:string;status:Status;createdAt:string}
export interface Tournament{id:string;publicNumber:string;name:string;discipline:string;format:string;city:string;venue:string;shortDescription:string;description:string;startAt:string;endAt:string;registrationEndsAt:string;rules:string[];imageName?:string}
export interface TournamentApplication{id:string;teamId:string;tournamentId:string;captainName:string;additionalInfo:string;status:Status;createdAt:string}
export interface AdminLog{id:string;date:string;admin:string;action:string;entityType:string;entityId:string;details:string}
