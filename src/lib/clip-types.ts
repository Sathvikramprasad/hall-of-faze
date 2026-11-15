/**
 * Clip API contracts (JSON shapes returned by /api/clips and /api/admin/clips).
 * Type-only module: safe to import from client components and other features.
 * Dates are ISO-8601 strings.
 */
import type { ClipStatus } from "@/lib/clip-rules";
import type { FazeDnaScores } from "@/lib/remix";

export type { ClipStatus } from "@/lib/clip-rules";

export type PublicFazeDnaAnalysis = {
  missionId: string;
  scores: FazeDnaScores;
  overallScore: number;
  strength: string;
  improvement: string;
  reaction: string;
  model: string;
  inputs: string[];
  ranAt: string;
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
  /** Same-origin URLs that redirect to short-lived signed storage URLs. */
  thumbnailUrl: string;
  videoUrl: string;
  createdAt: string;
  approvedAt: string;
  fazeDna: PublicFazeDnaAnalysis | null;
};

/** What the uploader (or a moderator) sees for a clip that may not be public yet. */
export type OwnerClip = Omit<PublicClip, "status" | "voteEligible" | "approvedAt"> & {
  status: ClipStatus;
  voteEligible: boolean;
  approvedAt: string | null;
  rejectionReason: string | null;
};

export type ModeratorClip = OwnerClip & {
  /** Present when the owning challenge is configured as a Remix the Vault mission. */
  remixMissionId: string | null;
  video: { contentType: string; size: number; originalName: string };
  thumbnail: { contentType: string; size: number };
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
  fazeDnaError: string | null;
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
