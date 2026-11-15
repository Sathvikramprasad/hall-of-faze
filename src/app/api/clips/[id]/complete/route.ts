import { after, type NextRequest } from "next/server";
import { hasValidOrigin } from "@/lib/api";
import { apiError, apiJson, handleRouteError, isClipId } from "@/lib/clip-http";
import { getViewer } from "@/lib/clip-identity";
import { findClipById, finalizeUpload, toOwnerClip } from "@/lib/clips";
import { isAutoAiReviewEnabled, runAiModeration } from "@/lib/gemini-moderation";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/clips/{id}/complete
 * Called by the uploader after both PUTs succeed. The server re-validates the
 * stored files (size, type, magic bytes) before the clip enters review.
 *
 *  200 → clip is now `pending_review` (still private)
 *  409 upload_incomplete → a file has not landed in storage yet; retry
 *  422 invalid_media → files failed validation; the clip and files were deleted
 */
export async function POST(request: NextRequest, { params }: Context) {
  if (!hasValidOrigin(request)) return apiError(403, "forbidden", "Invalid request origin.");
  const { id } = await params;
  if (!isClipId(id)) return apiError(404, "not_found", "Clip not found.");
  try {
    const [clip, viewer] = await Promise.all([findClipById(id), getViewer()]);
    if (!clip || viewer.userId === null || clip.uploaderId !== viewer.userId) {
      return apiError(404, "not_found", "Clip not found.");
    }
    if (clip.status !== "processing") {
      // Idempotent: a retried request after success just returns the clip.
      return apiJson({ clip: toOwnerClip(clip) });
    }

    const result = await finalizeUpload(clip);
    if (!result.ok) {
      if (result.kind === "incomplete") return apiError(409, "upload_incomplete", result.message);
      return apiError(422, "invalid_media", "The uploaded files were rejected.", result.issues);
    }

    if (isAutoAiReviewEnabled()) {
      // Advisory only — runs after the response, never approves on its own.
      after(() => runAiModeration(id).catch((e) => console.error("[clips] AI review failed:", e)));
    }
    return apiJson({ clip: toOwnerClip(result.clip) });
  } catch (error) {
    return handleRouteError(error, "POST /api/clips/[id]/complete");
  }
}
