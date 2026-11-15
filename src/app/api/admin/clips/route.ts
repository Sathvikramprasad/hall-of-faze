import { connection, type NextRequest } from "next/server";
import { isClipStatus } from "@/lib/clip-rules";
import { apiError, apiJson, handleRouteError } from "@/lib/clip-http";
import { requireModerator } from "@/lib/clip-moderator";
import { countClipsByStatus, listClipsForModeration } from "@/lib/clips";
import { isAiModerationConfigured } from "@/lib/gemini-moderation";

/** GET /api/admin/clips?status=pending_review — moderation queue (moderators only). */
export async function GET(request: NextRequest) {
  await connection();
  const { denied } = await requireModerator();
  if (denied) return denied;

  const status = request.nextUrl.searchParams.get("status") ?? "pending_review";
  if (!isClipStatus(status)) return apiError(400, "bad_request", "Unknown status.");
  try {
    const [clips, counts] = await Promise.all([listClipsForModeration(status), countClipsByStatus()]);
    return apiJson({ clips, counts, aiModerationAvailable: isAiModerationConfigured() });
  } catch (error) {
    return handleRouteError(error, "GET /api/admin/clips");
  }
}
