import type { NextRequest } from "next/server";
import { hasValidOrigin } from "@/lib/api";
import { apiError, apiJson, handleRouteError, isClipId } from "@/lib/clip-http";
import { requireModerator } from "@/lib/clip-moderator";
import { toModeratorClip } from "@/lib/clips";
import {
  FazeDnaError,
  isFazeDnaConfigured,
  runFazeDnaAnalysis,
} from "@/lib/gemini-remix";

export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };

/** POST /api/admin/clips/{id}/faze-dna — retry coaching for an approved remix. */
export async function POST(request: NextRequest, { params }: Context) {
  if (!hasValidOrigin(request)) return apiError(403, "forbidden", "Invalid request origin.");
  const { denied } = await requireModerator();
  if (denied) return denied;
  if (!isFazeDnaConfigured()) {
    return apiError(503, "ai_not_configured", "FaZe DNA is not configured (set GEMINI_API_KEY).");
  }
  const { id } = await params;
  if (!isClipId(id)) return apiError(404, "not_found", "Clip not found.");

  try {
    const clip = await runFazeDnaAnalysis(id, { force: true });
    if (!clip) return apiError(404, "not_found", "This clip is not part of a Remix the Vault mission.");
    return apiJson({ clip: toModeratorClip(clip) });
  } catch (error) {
    if (error instanceof FazeDnaError) return apiError(502, "ai_error", error.message);
    return handleRouteError(error, "POST /api/admin/clips/[id]/faze-dna");
  }
}
