import { type User } from "./types";

export type AuthUser = User & { avatar: string; bio: string };

export interface LocalAccount extends AuthUser {
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export type ProfilePatch = Partial<
  Pick<AuthUser, "firstName" | "lastName" | "phone" | "telegram" | "birthDate" | "bio">
>;
