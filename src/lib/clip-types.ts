/**
 * Clip API contracts (JSON shapes returned by /api/clips and /api/admin/clips).
 * Type-only module: safe to import from client components and other features.
 * Dates are ISO-8601 strings.
 */
import type { ClipStatus } from "@/lib/clip-rules";

export type { ClipStatus } from "@/lib/clip-rules";

/** Where a clip entered by link lives. Null for uploaded clips. */
export type PublicClipSource = {
  platform: "twitch" | "youtube";
  /** Twitch clip slug or YouTube video id, for the platform's embed player. */
  id: string;
  /** The clip's page on Twitch / YouTube. */
  url: string;
  channelName: string;
  /** The submitter proved this is their own channel. */
  verifiedOwner: boolean;
};

/** What anyone may see. Only ever produced for clips with status "approved". */
export type PublicClip = {
  id: string;
  title: string;
  description: string;
  challengeId: string | null;
  uploaderId: string;
  status: "approved";
  /** True for every public clip: approval is what makes a clip vote-eligible. */
  voteEligible: true;
  voteCount: number;
  durationSeconds: number | null;
  /**
   * Same-origin URLs. For uploads they redirect to short-lived signed storage
   * URLs; for link clips, to the platform's thumbnail and clip page.
   */
  thumbnailUrl: string;
  videoUrl: string;
  /** Set when the clip was entered by Twitch / YouTube link; play it with that platform's player. */
  source: PublicClipSource | null;
  createdAt: string;
  approvedAt: string;
};

/** What the uploader (or a moderator) sees for a clip that may not be public yet. */
export type OwnerClip = Omit<PublicClip, "status" | "voteEligible" | "approvedAt"> & {
  status: ClipStatus;
  voteEligible: boolean;
  approvedAt: string | null;
  rejectionReason: string | null;
};

export type ModeratorClip = OwnerClip & {
  /** Null for clips entered by link. */
  video: { contentType: string; size: number; originalName: string } | null;
  thumbnail: { contentType: string; size: number } | null;
  /** Channel the linked clip comes from (link clips only). */
  sourceChannelId: string | null;
  statusHistory: { from: ClipStatus | null; to: ClipStatus; at: string; by: string; reason?: string }[];
  moderation: { reviewedBy: string | null; reviewedAt: string | null };
  aiModeration: {
    verdict: "approve" | "review" | "reject";
    confidence: number;
    categories: string[];
    summary: string;
    model: string;
    inputs: string[];
    ranAt: string;
  } | null;
  aiModerationError: string | null;
};

export type ClipFeedResponse = { clips: PublicClip[]; nextCursor: string | null };

export type CreateClipRequest = {
  title: string;
  description?: string;
  challengeId?: string | null;
  video: { name: string; type: string; size: number; durationSeconds?: number };
  thumbnail: { name: string; type: string; size: number };
};

export type CreateClipResponse = {
  clip: OwnerClip;
  uploads: {
    video: { url: string; method: "PUT"; headers: Record<string, string> };
    thumbnail: { url: string; method: "PUT"; headers: Record<string, string> };
  };
  expiresInSeconds: number;
};

export type ModerationAction = "approve" | "reject" | "reopen";

/** GET /api/clips/link?url=… — what a pasted link points to, before it's submitted. */
export type LinkPreviewResponse = {
  preview: {
    platform: "twitch" | "youtube";
    id: string;
    url: string;
    title: string;
    channelName: string;
    thumbnailUrl: string;
    durationSeconds: number | null;
  };
  /** Whether the site requires link clips to come from the submitter's own verified channel. */
  ownChannelRequired: boolean;
  /** The submitter has verified this platform and the clip is from that channel. */
  fromYourChannel: boolean;
};

/** POST /api/clips/link */
export type CreateLinkClipRequest = {
  url: string;
  title?: string;
  description?: string;
  challengeId?: string | null;
};
