import { after, connection, type NextRequest } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Clip from "@/models/Clip";
import {
  validateDuration,
  validateText,
  validateThumbnailDescriptor,
  validateVideoDescriptor,
  type FileDescriptor,
  type ValidationIssue,
} from "@/lib/clip-rules";
import { apiError, apiJson, handleRouteError, readJsonBody } from "@/lib/clip-http";
import { ensureUploaderId } from "@/lib/clip-identity";
import {
  cleanupAbandonedUploads,
  FEED_DEFAULT_LIMIT,
  listApprovedClips,
  processingExpiry,
  toOwnerClip,
} from "@/lib/clips";
import type { ClipDocument } from "@/models/Clip";
import { clipObjectKeys, createUploadUrl, getStorageConfig, UPLOAD_URL_TTL_SECONDS } from "@/lib/storage";
import type { CreateClipResponse } from "@/lib/clip-types";

const CHALLENGE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * GET /api/clips — public, approved-only feed.
 * Query: ?challengeId=…&limit=1-50&cursor=…
 */
export async function GET(request: NextRequest) {
  await connection();
  const params = request.nextUrl.searchParams;
  const challengeId = params.get("challengeId");
  if (challengeId && !CHALLENGE_ID_PATTERN.test(challengeId)) {
    return apiError(400, "bad_request", "Invalid challengeId.");
  }
  const limitParam = params.get("limit");
  const limit = limitParam ? Number(limitParam) : FEED_DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1) {
    return apiError(400, "bad_request", "limit must be a positive integer.");
  }
  try {
    const feed = await listApprovedClips({ challengeId, limit, cursor: params.get("cursor") });
    return apiJson(feed, { publicCache: true });
  } catch (error) {
    return handleRouteError(error, "GET /api/clips");
  }
}

function asDescriptor(value: unknown): (FileDescriptor & { durationSeconds?: unknown }) | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (typeof v.name !== "string" || typeof v.type !== "string" || typeof v.size !== "number") return null;
  return { name: v.name.slice(0, 255), type: v.type, size: v.size, durationSeconds: v.durationSeconds };
}

/**
 * POST /api/clips — starts an upload.
 * Validates metadata, creates the clip in `processing` (private), and returns
 * presigned PUT URLs. The browser uploads straight to storage, then calls
 * POST /api/clips/{id}/complete.
 */
export async function POST(request: Request) {
  const body = await readJsonBody(request);
  if (!body) return apiError(400, "bad_request", "Request body must be a JSON object.");

  const video = asDescriptor(body.video);
  const thumbnail = asDescriptor(body.thumbnail);
  const issues: ValidationIssue[] = [...validateText(body.title, body.description)];
  if (!video) issues.push({ field: "video", message: "A video file is required." });
  else {
    issues.push(...validateVideoDescriptor(video));
    issues.push(...validateDuration(video.durationSeconds));
  }
  if (!thumbnail) issues.push({ field: "thumbnail", message: "A custom thumbnail is required." });
  else issues.push(...validateThumbnailDescriptor(thumbnail));

  const rawChallengeId = body.challengeId ?? null;
  const challengeId: string | null = typeof rawChallengeId === "string" ? rawChallengeId : null;
  if (
    rawChallengeId !== null &&
    (typeof rawChallengeId !== "string" || !CHALLENGE_ID_PATTERN.test(rawChallengeId))
  ) {
    issues.push({ field: "challengeId", message: "Invalid challenge." });
  }
  if (issues.length > 0 || !video || !thumbnail) {
    return apiError(422, "validation_failed", "Please fix the highlighted fields.", issues);
  }

  try {
    getStorageConfig(); // fail fast (503) before creating anything
    const uploaderId = await ensureUploaderId();
    await connectDB();

    const id = new Types.ObjectId();
    const keys = clipObjectKeys(id.toString(), video.type, thumbnail.type);
    const created = await Clip.create({
      _id: id,
      title: (body.title as string).trim(),
      description: typeof body.description === "string" ? body.description.trim() : "",
      challengeId,
      uploaderId,
      status: "processing",
      statusHistory: [{ from: null, to: "processing", at: new Date(), by: uploaderId, reason: "upload started" }],
      video: {
        key: keys.videoKey,
        contentType: video.type,
        size: video.size,
        originalName: video.name,
        durationSeconds: typeof video.durationSeconds === "number" ? Math.round(video.durationSeconds * 10) / 10 : null,
      },
      thumbnail: { key: keys.thumbnailKey, contentType: thumbnail.type, size: thumbnail.size },
      processingExpiresAt: processingExpiry(),
    });

    // Opportunistically clear abandoned uploads after responding.
    after(() => cleanupAbandonedUploads().catch((e) => console.error("[clips] cleanup failed:", e)));

    const response: CreateClipResponse = {
      clip: toOwnerClip(created.toObject() as unknown as ClipDocument),
      uploads: {
        video: {
          url: createUploadUrl(keys.videoKey, video.type),
          method: "PUT",
          headers: { "Content-Type": video.type },
        },
        thumbnail: {
          url: createUploadUrl(keys.thumbnailKey, thumbnail.type),
          method: "PUT",
          headers: { "Content-Type": thumbnail.type },
        },
      },
      expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
    };
    return apiJson(response, { status: 201 });
  } catch (error) {
    return handleRouteError(error, "POST /api/clips");
  }
}
