/**
 * Clip data access and business rules. Server-only.
 *
 * Integration points for other features (stable — please import these rather
 * than querying the Clip collection directly):
 *   - listApprovedClips()   approved-only, paginated public feed
 *   - getApprovedClip(id)   a single public clip, or null
 *   - isClipVoteEligible()  use in vote validation
 */
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Clip, { PROCESSING_TTL_MS, type ClipDocument } from "@/models/Clip";
import Vote from "@/models/Vote";
import {
  canTransition,
  SNIFF_BYTES,
  sniffImageType,
  sniffVideoType,
  THUMBNAIL_MAX_BYTES,
  VIDEO_MAX_BYTES,
  videoTypesCompatible,
  type ClipStatus,
  type ValidationIssue,
} from "@/lib/clip-rules";
import { deleteObjectsQuietly, headObject, readObjectRange } from "@/lib/storage";
import type { ModeratorClip, OwnerClip, PublicClip, PublicClipSource } from "@/lib/clip-types";

export { PROCESSING_TTL_MS };

type LeanClip = ClipDocument;

/* ------------------------------------------------------------------ */
/* Serialization                                                       */
/* ------------------------------------------------------------------ */

function mediaUrls(id: string) {
  return {
    thumbnailUrl: `/api/clips/${id}/media/thumbnail`,
    videoUrl: `/api/clips/${id}/media/video`,
  };
}

function publicSource(clip: LeanClip): PublicClipSource | null {
  const source = clip.source;
  if (!source) return null;
  return {
    platform: source.platform,
    id: source.id,
    url: source.url,
    channelName: source.channelName ?? "",
    verifiedOwner: Boolean(source.verifiedOwner),
  };
}

function clipDuration(clip: LeanClip): number | null {
  return clip.video?.durationSeconds ?? clip.source?.durationSeconds ?? null;
}

export function toPublicClip(clip: LeanClip, voteCount = clip.voteCount ?? 0): PublicClip {
  if (clip.status !== "approved" || !clip.approvedAt) {
    // Defensive: a non-approved clip must never be serialized publicly.
    throw new Error("toPublicClip called with a clip that is not approved");
  }
  const id = clip._id.toString();
  return {
    id,
    title: clip.title,
    description: clip.description ?? "",
    challengeId: clip.challengeId ?? null,
    uploaderId: clip.uploaderId,
    status: "approved",
    voteEligible: true,
    voteCount,
    durationSeconds: clipDuration(clip),
    ...mediaUrls(id),
    source: publicSource(clip),
    createdAt: new Date(clip.createdAt).toISOString(),
    approvedAt: new Date(clip.approvedAt).toISOString(),
  };
}

export function toOwnerClip(clip: LeanClip, voteCount = clip.voteCount ?? 0): OwnerClip {
  const id = clip._id.toString();
  return {
    id,
    title: clip.title,
    description: clip.description ?? "",
    challengeId: clip.challengeId ?? null,
    uploaderId: clip.uploaderId,
    status: clip.status,
    voteEligible: clip.status === "approved",
    voteCount,
    durationSeconds: clipDuration(clip),
    ...mediaUrls(id),
    source: publicSource(clip),
    createdAt: new Date(clip.createdAt).toISOString(),
    approvedAt: clip.approvedAt ? new Date(clip.approvedAt).toISOString() : null,
    rejectionReason: clip.moderation?.rejectionReason ?? null,
  };
}

export function toModeratorClip(clip: LeanClip, voteCount = clip.voteCount ?? 0): ModeratorClip {
  const ai = clip.aiModeration;
  return {
    ...toOwnerClip(clip, voteCount),
    video: clip.video?.key
      ? {
          contentType: clip.video.contentType,
          size: clip.video.size,
          originalName: clip.video.originalName ?? "",
        }
      : null,
    thumbnail: clip.thumbnail?.key ? { contentType: clip.thumbnail.contentType, size: clip.thumbnail.size } : null,
    sourceChannelId: clip.source?.channelId ?? null,
    statusHistory: (clip.statusHistory ?? []).map((h) => ({
      from: h.from ?? null,
      to: h.to,
      at: new Date(h.at).toISOString(),
      by: h.by,
      ...(h.reason ? { reason: h.reason } : {}),
    })),
    moderation: {
      reviewedBy: clip.moderation?.reviewedBy ?? null,
      reviewedAt: clip.moderation?.reviewedAt ? new Date(clip.moderation.reviewedAt).toISOString() : null,
    },
    aiModeration: ai
      ? {
          verdict: ai.verdict,
          confidence: ai.confidence,
          categories: ai.categories ?? [],
          summary: ai.summary,
          model: ai.model,
          inputs: ai.inputs ?? [],
          ranAt: new Date(ai.ranAt).toISOString(),
        }
      : null,
    aiModerationError: clip.aiModerationError ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function findClipById(id: string): Promise<LeanClip | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDB();
  return Clip.findById(id).lean<LeanClip>().exec();
}

/** Who may see a clip (including its media) right now. */
export function canViewClip(
  clip: Pick<LeanClip, "status" | "uploaderId">,
  viewer: { userId: string | null; isModerator: boolean },
): boolean {
  if (clip.status === "approved") return true;
  if (viewer.isModerator) return true;
  // Uploaders may preview their own clip once the upload is verified.
  return (
    viewer.userId !== null &&
    viewer.userId === clip.uploaderId &&
    clip.status !== "processing"
  );
}

type Cursor = { approvedAt: Date; id: Types.ObjectId };

function encodeCursor(clip: LeanClip): string {
  return Buffer.from(`${new Date(clip.approvedAt!).getTime()}_${clip._id.toString()}`).toString("base64url");
}

function decodeCursor(cursor: string | null | undefined): Cursor | null {
  if (!cursor) return null;
  try {
    const [ms, id] = Buffer.from(cursor, "base64url").toString("utf8").split("_");
    if (!/^\d+$/.test(ms) || !Types.ObjectId.isValid(id)) return null;
    return { approvedAt: new Date(Number(ms)), id: new Types.ObjectId(id) };
  } catch {
    return null;
  }
}

export const FEED_DEFAULT_LIMIT = 24;
export const FEED_MAX_LIMIT = 50;

/** Approved-only feed, newest approval first. The status filter is not optional. */
export async function listApprovedClips(
  options: { challengeId?: string | null; limit?: number; cursor?: string | null } = {},
): Promise<{ clips: PublicClip[]; nextCursor: string | null }> {
  await connectDB();
  const limit = Math.min(Math.max(1, Math.floor(options.limit ?? FEED_DEFAULT_LIMIT)), FEED_MAX_LIMIT);
  const filter: Record<string, unknown> = { status: "approved", approvedAt: { $ne: null } };
  if (options.challengeId) filter.challengeId = options.challengeId;
  const cursor = decodeCursor(options.cursor);
  if (cursor) {
    filter.$or = [
      { approvedAt: { $lt: cursor.approvedAt } },
      { approvedAt: cursor.approvedAt, _id: { $lt: cursor.id } },
    ];
  }
  const docs = await Clip.find(filter)
    .sort({ approvedAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean<LeanClip[]>()
    .exec();
  const page = docs.slice(0, limit);
  const counts = await getVoteCounts(page.map((clip) => clip._id.toString()));
  return {
    clips: page.map((clip) => toPublicClip(clip, counts.get(clip._id.toString()) ?? 0)),
    nextCursor: docs.length > limit ? encodeCursor(page[page.length - 1]) : null,
  };
}

export async function getApprovedClip(id: string): Promise<PublicClip | null> {
  const clip = await findClipById(id);
  if (!clip || clip.status !== "approved" || !clip.approvedAt) return null;
  return toPublicClip(clip, await getClipVoteCount(id));
}

export async function getVoteCounts(clipIds: string[]): Promise<Map<string, number>> {
  if (clipIds.length === 0) return new Map();
  await connectDB();
  const rows = await Vote.aggregate<{ _id: string; voteCount: number }>([
    { $match: { clipId: { $in: clipIds } } },
    { $group: { _id: "$clipId", voteCount: { $sum: 1 } } },
  ]).exec();
  return new Map(rows.map((row) => [row._id, row.voteCount]));
}

export async function getClipVoteCount(clipId: string): Promise<number> {
  return (await getVoteCounts([clipId])).get(clipId) ?? 0;
}

/**
 * Vote eligibility: the clip exists, is approved, and (when a challenge id is
 * given) belongs to that challenge. Challenge timing (late votes) is checked by
 * the voting feature.
 */
export async function isClipVoteEligible(clipId: string, challengeId?: string): Promise<boolean> {
  if (!Types.ObjectId.isValid(clipId)) return false;
  await connectDB();
  return Boolean(await Clip.exists({
    _id: clipId,
    status: "approved",
    approvedAt: { $ne: null },
    ...(challengeId === undefined ? {} : { challengeId }),
  }));
}

export async function listClipsForModeration(
  status: ClipStatus,
  limit = 50,
): Promise<ModeratorClip[]> {
  await connectDB();
  const docs = await Clip.find({ status })
    .sort(status === "pending_review" ? { createdAt: 1 } : { updatedAt: -1 })
    .limit(Math.min(Math.max(1, limit), 100))
    .lean<LeanClip[]>()
    .exec();
  const counts = status === "approved"
    ? await getVoteCounts(docs.map((clip) => clip._id.toString()))
    : new Map<string, number>();
  return docs.map((clip) => toModeratorClip(clip, counts.get(clip._id.toString()) ?? 0));
}

export async function countClipsByStatus(): Promise<Record<ClipStatus, number>> {
  await connectDB();
  const rows = await Clip.aggregate<{ _id: ClipStatus; n: number }>([
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const counts: Record<ClipStatus, number> = { processing: 0, pending_review: 0, approved: 0, rejected: 0 };
  for (const row of rows) counts[row._id] = row.n;
  return counts;
}

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export class ClipTransitionError extends Error {
  readonly code: "not_found" | "conflict";

  constructor(code: "not_found" | "conflict", message: string) {
    super(message);
    this.name = "ClipTransitionError";
    this.code = code;
  }
}

/**
 * Moves a clip to a new status if the transition is allowed. Uses the current
 * status as an optimistic lock, so two moderators cannot both act on one clip.
 */
export async function transitionClip(
  id: string,
  to: ClipStatus,
  by: string,
  reason?: string,
): Promise<LeanClip> {
  const current = await findClipById(id);
  if (!current) throw new ClipTransitionError("not_found", "Clip not found.");
  if (!canTransition(current.status, to)) {
    throw new ClipTransitionError(
      "conflict",
      `A clip that is "${current.status}" cannot be moved to "${to}".`,
    );
  }

  const now = new Date();
  const set: Record<string, unknown> = { status: to };
  if (to === "approved") {
    set.approvedAt = now;
    set["moderation.reviewedBy"] = by;
    set["moderation.reviewedAt"] = now;
    set["moderation.rejectionReason"] = null;
  } else if (to === "rejected") {
    set.approvedAt = null; // takedowns leave the public feed immediately
    set["moderation.reviewedBy"] = by;
    set["moderation.reviewedAt"] = now;
    set["moderation.rejectionReason"] = reason?.trim() || null;
  } else if (to === "pending_review") {
    set.processingExpiresAt = null;
    if (current.status === "rejected") set["moderation.rejectionReason"] = null;
  }

  const updated = await Clip.findOneAndUpdate(
    { _id: current._id, status: current.status },
    {
      $set: set,
      $push: {
        statusHistory: {
          from: current.status,
          to,
          at: now,
          by,
          ...(reason?.trim() ? { reason: reason.trim().slice(0, 500) } : {}),
        },
      },
    },
    { returnDocument: "after" },
  )
    .lean<LeanClip>()
    .exec();

  if (!updated) {
    throw new ClipTransitionError("conflict", "This clip was changed by someone else. Refresh and try again.");
  }
  return updated;
}

/** Deletes a clip record, its votes and its stored objects. */
export async function deleteClipAndMedia(clip: LeanClip): Promise<void> {
  await deleteObjectsQuietly([clip.video?.key, clip.thumbnail?.key]);
  await Vote.deleteMany({ clipId: clip._id.toString() }).exec();
  await Clip.deleteOne({ _id: clip._id }).exec();
}

export type FinalizeResult =
  | { ok: true; clip: LeanClip }
  | { ok: false; kind: "incomplete"; message: string }
  | { ok: false; kind: "invalid"; issues: ValidationIssue[] };

/**
 * Verifies an uploaded clip in storage — existence, exact size, declared type
 * and real file signature — and moves it to `pending_review`. Invalid uploads
 * are deleted (record and objects) so nothing half-valid lingers.
 */
export async function finalizeUpload(clip: LeanClip): Promise<FinalizeResult> {
  if (clip.status !== "processing" || !clip.video?.key || !clip.thumbnail?.key) {
    return { ok: false, kind: "invalid", issues: [{ field: "status", message: "This upload was already finalized." }] };
  }

  const [videoMeta, thumbMeta] = await Promise.all([
    headObject(clip.video.key),
    headObject(clip.thumbnail.key),
  ]);
  if (!videoMeta || !thumbMeta) {
    const missing = [!videoMeta && "video", !thumbMeta && "thumbnail"].filter(Boolean).join(" and ");
    return { ok: false, kind: "incomplete", message: `The ${missing} upload has not finished yet.` };
  }

  const issues: ValidationIssue[] = [];
  if (videoMeta.size !== clip.video.size) {
    issues.push({ field: "video", message: "Uploaded video size does not match what was declared." });
  }
  if (videoMeta.size > VIDEO_MAX_BYTES) issues.push({ field: "video", message: "Uploaded video is too large." });
  if (thumbMeta.size !== clip.thumbnail.size) {
    issues.push({ field: "thumbnail", message: "Uploaded thumbnail size does not match what was declared." });
  }
  if (thumbMeta.size >= THUMBNAIL_MAX_BYTES) {
    issues.push({ field: "thumbnail", message: "Uploaded thumbnail must be under 5 MB." });
  }

  if (issues.length === 0) {
    const [videoHead, thumbHead] = await Promise.all([
      readObjectRange(clip.video.key, 0, SNIFF_BYTES - 1),
      readObjectRange(clip.thumbnail.key, 0, SNIFF_BYTES - 1),
    ]);
    const realVideo = sniffVideoType(videoHead);
    if (!realVideo || !videoTypesCompatible(clip.video.contentType, realVideo)) {
      issues.push({ field: "video", message: "The video file is not a valid MP4, WebM, or MOV file." });
    }
    const realThumb = sniffImageType(thumbHead);
    if (!realThumb || realThumb !== clip.thumbnail.contentType) {
      issues.push({ field: "thumbnail", message: "The thumbnail is not a valid JPG, PNG, or WebP image." });
    }
  }

  if (issues.length > 0) {
    await deleteClipAndMedia(clip);
    return { ok: false, kind: "invalid", issues };
  }

  const updated = await transitionClip(clip._id.toString(), "pending_review", "system", "upload verified");
  return { ok: true, clip: updated };
}

/** Removes uploads that never finished (record + objects). Returns how many were removed. */
export async function cleanupAbandonedUploads(now = new Date(), batchSize = 50): Promise<number> {
  await connectDB();
  const stale = await Clip.find({ status: "processing", processingExpiresAt: { $lt: now } })
    .limit(batchSize)
    .lean<LeanClip[]>()
    .exec();
  for (const clip of stale) {
    await deleteClipAndMedia(clip);
  }
  return stale.length;
}

export function processingExpiry(now = new Date()): Date {
  return new Date(now.getTime() + PROCESSING_TTL_MS);
}
