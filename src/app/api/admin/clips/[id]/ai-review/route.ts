import { apiError, apiJson, handleRouteError, isClipId } from "@/lib/clip-http";
import { requireModerator } from "@/lib/clip-moderator";
import { toModeratorClip } from "@/lib/clips";
import { AiModerationError, isAiModerationConfigured, runAiModeration } from "@/lib/gemini-moderation";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/clips/{id}/ai-review — runs Gemini structured moderation.
 * Advisory: stores a recommendation for the moderator; never changes status.
 */
export async function POST(_request: Request, { params }: Context) {
  const { denied } = await requireModerator();
  if (denied) return denied;
  if (!isAiModerationConfigured()) {
    return apiError(503, "ai_not_configured", "AI moderation is not configured (set GEMINI_API_KEY).");
  }
  const { id } = await params;
  if (!isClipId(id)) return apiError(404, "not_found", "Clip not found.");
  try {
    const clip = await runAiModeration(id);
    if (!clip) return apiError(404, "not_found", "Clip not found.");
    return apiJson({ clip: toModeratorClip(clip) });
  } catch (error) {
    if (error instanceof AiModerationError) return apiError(502, "ai_error", error.message);
    return handleRouteError(error, "POST /api/admin/clips/[id]/ai-review");
  }
}
