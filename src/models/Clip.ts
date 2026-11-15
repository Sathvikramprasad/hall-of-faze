import mongoose, { Schema, type Model, type Types } from "mongoose";
import {
  CLIP_STATUSES,
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  THUMBNAIL_TYPES,
  VIDEO_TYPES,
  type ClipStatus,
} from "@/lib/clip-rules";
import type { FazeDnaScores } from "@/lib/remix";

export { CLIP_STATUSES, CLIP_STATUS_TRANSITIONS, canTransition } from "@/lib/clip-rules";
export type { ClipStatus } from "@/lib/clip-rules";

/** How long an upload may stay in `processing` before it is considered abandoned. */
export const PROCESSING_TTL_MS = 2 * 60 * 60 * 1000;

export type ClipMedia = {
  key: string; // private object key, never sent to clients
  contentType: string;
  size: number;
};

export type ClipStatusChange = {
  from: ClipStatus | null;
  to: ClipStatus;
  at: Date;
  by: string; // user id, "system", or "moderator"
  reason?: string;
};

/**
 * Set for clips entered by link instead of uploaded: a Twitch clip or a YouTube
 * video, played in that platform's own player. Nothing is stored in our bucket.
 */
export type ClipSource = {
  platform: "twitch" | "youtube";
  /** Twitch clip slug or YouTube video id. */
  id: string;
  url: string;
  /** Twitch broadcaster id or YouTube channel id. */
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
  /** True when the submitter proved they own `channelId` (Connect Twitch / Connect YouTube). */
  verifiedOwner: boolean;
};

export type AiModerationResult = {
  verdict: "approve" | "review" | "reject";
  confidence: number;
  categories: string[];
  summary: string;
  model: string;
  inputs: string[]; // e.g. ["text", "thumbnail", "video"]
  ranAt: Date;
};

export type FazeDnaAnalysisResult = {
  missionId: string;
  scores: FazeDnaScores;
  overallScore: number;
  strength: string;
  improvement: string;
  reaction: string;
  model: string;
  inputs: string[];
  ranAt: Date;
};

export interface IClip {
  title: string;
  description: string;
  /** Owning challenge (Sathvik's `Challenge` id) — optional until challenges exist. */
  challengeId: string | null;
  /** Stable uploader identity (see src/lib/clip-identity.ts). */
  uploaderId: string;
  status: ClipStatus;
  statusHistory: ClipStatusChange[];
  /** Uploaded files. Absent for clips entered by link (see `source`). */
  video?: ClipMedia & { originalName: string; durationSeconds: number | null };
  thumbnail?: ClipMedia;
  /** Twitch / YouTube link the clip was entered with, or null for uploads. */
  source?: ClipSource | null;
  /** Human or guarded AI moderation decision. */
  moderation: {
    reviewedBy: string | null;
    reviewedAt: Date | null;
    rejectionReason: string | null;
  };
  /** Gemini safety and eligibility recommendation. */
  aiModeration: AiModerationResult | null;
  aiModerationError: string | null;
  /** Post-approval creative coaching for a Remix the Vault mission. */
  fazeDna: FazeDnaAnalysisResult | null;
  fazeDnaError: string | null;
  approvedAt: Date | null;
  /** Legacy snapshot retained for schema compatibility; Vote records are authoritative. */
  voteCount: number;
  /** Set while `processing`; after this time the upload counts as abandoned. */
  processingExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ClipDocument = IClip & { _id: Types.ObjectId };

/** Uploaded files are required unless the clip was entered by link. */
function isUpload(this: { source?: ClipSource | null }) {
  return !this.source;
}

const mediaFields = {
  key: { type: String, required: isUpload },
  contentType: { type: String, required: isUpload },
  size: { type: Number, required: isUpload, min: 1 },
};

const ClipSourceSchema = new Schema<ClipSource>(
  {
    platform: { type: String, enum: ["twitch", "youtube"], required: true },
    id: { type: String, required: true, maxlength: 120 },
    url: { type: String, required: true, maxlength: 500 },
    channelId: { type: String, required: true, maxlength: 120 },
    channelName: { type: String, default: "", maxlength: 200 },
    thumbnailUrl: { type: String, default: "", maxlength: 1000 },
    durationSeconds: { type: Number, default: null },
    verifiedOwner: { type: Boolean, default: false },
  },
  { _id: false },
);

const AiModerationSchema = new Schema<AiModerationResult>(
  {
    verdict: { type: String, enum: ["approve", "review", "reject"], required: true },
    confidence: { type: Number, required: true },
    categories: { type: [String], default: [] },
    summary: { type: String, default: "" },
    model: { type: String, required: true },
    inputs: { type: [String], default: [] },
    ranAt: { type: Date, required: true },
  },
  { _id: false },
);

const FazeDnaAnalysisSchema = new Schema<FazeDnaAnalysisResult>(
  {
    missionId: { type: String, required: true },
    scores: {
      skill: { type: Number, required: true, min: 0, max: 100 },
      originality: { type: Number, required: true, min: 0, max: 100 },
      hype: { type: Number, required: true, min: 0, max: 100 },
      legacyConnection: { type: Number, required: true, min: 0, max: 100 },
    },
    overallScore: { type: Number, required: true, min: 0, max: 100 },
    strength: { type: String, required: true, maxlength: 600 },
    improvement: { type: String, required: true, maxlength: 600 },
    reaction: { type: String, required: true, maxlength: 300 },
    model: { type: String, required: true },
    inputs: { type: [String], default: [] },
    ranAt: { type: Date, required: true },
  },
  { _id: false },
);

const ClipSchema = new Schema<IClip>(
  {
    title: { type: String, required: true, trim: true, maxlength: TITLE_MAX_LENGTH },
    description: { type: String, default: "", trim: true, maxlength: DESCRIPTION_MAX_LENGTH },
    challengeId: { type: String, default: null, index: true },
    uploaderId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: CLIP_STATUSES,
      required: true,
      default: "processing",
    },
    statusHistory: {
      type: [
        {
          _id: false,
          from: { type: String, enum: [...CLIP_STATUSES, null], default: null },
          to: { type: String, enum: CLIP_STATUSES, required: true },
          at: { type: Date, required: true },
          by: { type: String, required: true },
          reason: { type: String },
        },
      ],
      default: [],
    },
    video: {
      ...mediaFields,
      contentType: { type: String, required: isUpload, enum: VIDEO_TYPES },
      originalName: { type: String, default: "", maxlength: 255 },
      durationSeconds: { type: Number, default: null },
    },
    thumbnail: {
      ...mediaFields,
      contentType: { type: String, required: isUpload, enum: THUMBNAIL_TYPES },
    },
    source: { type: ClipSourceSchema, default: null },
    moderation: {
      reviewedBy: { type: String, default: null },
      reviewedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: null, maxlength: 500 },
    },
    aiModeration: { type: AiModerationSchema, default: null },
    aiModerationError: { type: String, default: null },
    fazeDna: { type: FazeDnaAnalysisSchema, default: null },
    fazeDnaError: { type: String, default: null },
    approvedAt: { type: Date, default: null },
    voteCount: { type: Number, default: 0, min: 0 },
    processingExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Public feed: approved clips, newest approval first (optionally per challenge).
ClipSchema.index({ status: 1, approvedAt: -1, _id: -1 });
ClipSchema.index({ challengeId: 1, status: 1, approvedAt: -1 });
// Moderation queue: oldest first within a status.
ClipSchema.index({ status: 1, createdAt: 1 });
// Abandoned uploads (record + stored objects) are removed by
// cleanupAbandonedUploads() in src/lib/clips.ts. Not a TTL index on purpose:
// a TTL delete would orphan the objects in storage.
ClipSchema.index({ status: 1, processingExpiresAt: 1 });
// Duplicate check for clips entered by link (same Twitch clip / YouTube video).
ClipSchema.index({ "source.platform": 1, "source.id": 1, challengeId: 1 });

export const Clip: Model<IClip> =
  (mongoose.models.Clip as Model<IClip> | undefined) ?? mongoose.model<IClip>("Clip", ClipSchema);

export default Clip;
