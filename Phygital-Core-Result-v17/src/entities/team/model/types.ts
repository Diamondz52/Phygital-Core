export interface TeamMember {
  id: string;
  name: string;
  captain?: boolean;
}
export interface Team {
  id: string;
  name: string;
  discipline: string;
  members: TeamMember[];
  createdAt?: string;
  updatedAt?: string;
}
