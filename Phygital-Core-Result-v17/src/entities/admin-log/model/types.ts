export interface AdminLog {
  id: string;
  date: string;
  admin: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}
