export type UserRole = "USER" | "ADMIN";
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegram: string;
  birthDate: string;
  role: UserRole;
  bio?: string;
  avatar?: string;
  createdAt?: string;
}
