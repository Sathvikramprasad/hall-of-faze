import mongoose, { Schema, type Model, type Types } from "mongoose";
import {
  CLIP_STATUSES,
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  THUMBNAIL_TYPES,
  VIDEO_TYPES,
  type ClipStatus,
} from "@/lib/clip-rules";

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

export type AiModerationResult = {
  verdict: "approve" | "review" | "reject";
  confidence: number;
  categories: string[];
  summary: string;
  model: string;
  inputs: string[]; // e.g. ["text", "thumbnail", "video"]
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
  video: ClipMedia & { originalName: string; durationSeconds: number | null };
  thumbnail: ClipMedia;
  /** Manual moderation decision. */
  moderation: {
    reviewedBy: string | null;
    reviewedAt: Date | null;
    rejectionReason: string | null;
  };
  /** Advisory Gemini result. Never approves a clip on its own. */
  aiModeration: AiModerationResult | null;
  aiModerationError: string | null;
  approvedAt: Date | null;
  /** Maintained by the voting feature; included so feeds can sort/show it. */
  voteCount: number;
  /** Set while `processing`; after this time the upload counts as abandoned. */
  processingExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ClipDocument = IClip & { _id: Types.ObjectId };

const mediaFields = {
  key: { type: String, required: true },
  contentType: { type: String, required: true },
  size: { type: Number, required: true, min: 1 },
};

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
      contentType: { type: String, required: true, enum: VIDEO_TYPES },
      originalName: { type: String, default: "", maxlength: 255 },
      durationSeconds: { type: Number, default: null },
    },
    thumbnail: {
      ...mediaFields,
      contentType: { type: String, required: true, enum: THUMBNAIL_TYPES },
    },
    moderation: {
      reviewedBy: { type: String, default: null },
      reviewedAt: { type: Date, default: null },
      rejectionReason: { type: String, default: null, maxlength: 500 },
    },
    aiModeration: {
      type: {
        _id: false,
        verdict: { type: String, enum: ["approve", "review", "reject"] },
        confidence: Number,
        categories: [String],
        summary: String,
        model: String,
        inputs: [String],
        ranAt: Date,
      },
      default: null,
    },
    aiModerationError: { type: String, default: null },
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

export const Clip: Model<IClip> =
  (mongoose.models.Clip as Model<IClip> | undefined) ?? mongoose.model<IClip>("Clip", ClipSchema);

export default Clip;
