import type { ID, ISODateTime } from "./api";

export type Role = "user" | "moderator";

export interface SocialLinks {
  twitch?: string;
  youtube?: string;
}

/** Public-safe user fields. Never put password hashes or session tokens here. */
export interface User {
  id: ID;
  displayName: string;
  role: Role;
  socialLinks: SocialLinks;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

/** Only returned to the account owner from /api/user/me. */
export interface AccountUser extends User {
  email: string;
  /** False until the emailed verification code is entered. */
  emailVerified: boolean;
  /** Same-origin URL of the uploaded profile picture, or null to show the first letter of the name. */
  avatarUrl: string | null;
}
