import type { ID, ISODateTime } from "./api";

export type ChallengeStatus = "draft" | "active" | "closed";

/** Shared contract; the community feature owns the Challenge database model. */
export interface Challenge {
  id: ID;
  title: string;
  description: string;
  status: ChallengeStatus;
  startsAt: ISODateTime;
  endsAt: ISODateTime;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
