import type { ID, ISODateTime } from "./api";

export type ClipStatus = "processing" | "pending_review" | "approved" | "rejected";

/** Shared cross-feature contract. Upload / moderation owns its persistence model. */
export interface Clip {
  id: ID;
  userId: ID;
  challengeId?: ID;
  title: string;
  description?: string;
  mediaUrl?: string; // Present only where the clip may be viewed.
  thumbnailUrl?: string;
  status: ClipStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
