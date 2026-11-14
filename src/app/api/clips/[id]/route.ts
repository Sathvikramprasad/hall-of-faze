import { apiError, apiJson, handleRouteError, isClipId } from "@/lib/clip-http";
import { getViewer } from "@/lib/clip-identity";
import { canViewClip, deleteClipAndMedia, findClipById, toModeratorClip, toOwnerClip, toPublicClip } from "@/lib/clips";

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/clips/{id}
 * Approved clips are public. Unapproved clips are visible only to their
 * uploader and to moderators; everyone else gets 404 (not 403), so the
 * existence of private clips is not revealed.
 */
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!isClipId(id)) return apiError(404, "not_found", "Clip not found.");
  try {
    const [clip, viewer] = await Promise.all([findClipById(id), getViewer()]);
    if (!clip || !canViewClip(clip, viewer)) return apiError(404, "not_found", "Clip not found.");
    if (viewer.isModerator) return apiJson({ clip: toModeratorClip(clip) });
    if (clip.status === "approved") return apiJson({ clip: toPublicClip(clip) });
    return apiJson({ clip: toOwnerClip(clip) });
  } catch (error) {
    return handleRouteError(error, "GET /api/clips/[id]");
  }
}

/**
 * DELETE /api/clips/{id}
 * Uploaders can cancel/delete their own clip while it is not approved
 * (approved clips may carry votes; a moderator takes those down instead).
 * Moderators can delete any clip.
 */
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params;
  if (!isClipId(id)) return apiError(404, "not_found", "Clip not found.");
  try {
    const [clip, viewer] = await Promise.all([findClipById(id), getViewer()]);
    const isOwner = clip !== null && viewer.userId !== null && viewer.userId === clip.uploaderId;
    if (!clip || (!isOwner && !viewer.isModerator)) return apiError(404, "not_found", "Clip not found.");
    if (!viewer.isModerator && clip.status === "approved") {
      return apiError(409, "conflict", "Approved clips can only be removed by a moderator.");
    }
    await deleteClipAndMedia(clip);
    return apiJson({ deleted: true });
  } catch (error) {
    return handleRouteError(error, "DELETE /api/clips/[id]");
  }
}
