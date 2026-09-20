import type { UserRole } from "@/entities";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegram: string;
  birthDate: string;
  avatar: string;
  bio: string;
  role: UserRole;
}

export interface LocalAccount extends AuthUser {
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export type ProfilePatch = Partial<Pick<AuthUser, "firstName" | "lastName" | "phone" | "telegram" | "birthDate" | "bio">>;
