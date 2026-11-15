import { after, type NextRequest } from "next/server";
import { hasValidOrigin } from "@/lib/api";
import { apiError, apiJson, handleRouteError, isClipId, readJsonBody } from "@/lib/clip-http";
import { moderatorLabel } from "@/lib/clip-identity";
import { requireModerator } from "@/lib/clip-moderator";
import { ClipTransitionError, toModeratorClip, transitionClip } from "@/lib/clips";
import type { ClipStatus } from "@/lib/clip-rules";
import type { ModerationAction } from "@/lib/clip-types";
import { runFazeDnaAnalysis } from "@/lib/gemini-remix";

export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };

const TARGET: Record<ModerationAction, ClipStatus> = {
  approve: "approved",
  reject: "rejected",
  reopen: "pending_review",
};

/**
 * PATCH /api/admin/clips/{id}  { action: "approve" | "reject" | "reopen", reason?: string }
 * approve: pending_review → approved (public + vote-eligible)
 * reject:  pending_review|approved → rejected (reason required for takedowns)
 * reopen:  rejected → pending_review
 */
export async function PATCH(request: NextRequest, { params }: Context) {
  if (!hasValidOrigin(request)) return apiError(403, "forbidden", "Invalid request origin.");
  const { viewer, denied } = await requireModerator();
  if (denied) return denied;

  const { id } = await params;
  if (!isClipId(id)) return apiError(404, "not_found", "Clip not found.");

  const body = await readJsonBody(request);
  const action = body?.action;
  if (action !== "approve" && action !== "reject" && action !== "reopen") {
    return apiError(400, "bad_request", 'action must be "approve", "reject", or "reopen".');
  }
  const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (action === "reject" && reason.length === 0) {
    return apiError(422, "validation_failed", "Give a short reason when rejecting a clip.", [
      { field: "reason", message: "A rejection reason is required." },
    ]);
  }

  try {
    const clip = await transitionClip(id, TARGET[action], moderatorLabel(viewer), reason || undefined);
    if (action === "approve") {
      // Public approval should not wait on Gemini. Non-remix clips return null.
      after(() =>
        runFazeDnaAnalysis(id).catch((error) =>
          console.error("[clips] FaZe DNA analysis failed after moderator approval:", error),
        ),
      );
    }
    return apiJson({ clip: toModeratorClip(clip) });
  } catch (error) {
    if (error instanceof ClipTransitionError) {
      return apiError(error.code === "not_found" ? 404 : 409, error.code, error.message);
    }
    return handleRouteError(error, "PATCH /api/admin/clips/[id]");
  }
}
