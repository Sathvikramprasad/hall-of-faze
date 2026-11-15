import { after, type NextRequest } from "next/server";
import { hasValidOrigin } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { apiError, apiJson, handleRouteError, readJsonBody } from "@/lib/clip-http";
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH, type ValidationIssue } from "@/lib/clip-rules";
import { toOwnerClip } from "@/lib/clips";
import type { LinkPreviewResponse } from "@/lib/clip-types";
import { getPublicChallenge } from "@/lib/community-data";
import { isChallengeOpen } from "@/lib/community-rules";
import { isAutoAiReviewEnabled, runAiModeration } from "@/lib/gemini-moderation";
import {
  createLinkClip,
  DuplicateLinkClipError,
  isFromOwnChannel,
  isOwnChannelRequired,
  lookupClipLink,
  ownershipProblem,
} from "@/lib/link-clips";
import { consumeRateLimit } from "@/lib/rate-limit";

const CHALLENGE_ID_PATTERN = /^[a-f0-9]{24}$/i;

async function limited(scope: string, userId: string, limit: number) {
  const result = await consumeRateLimit({ scope, identifier: userId, limit, windowMs: 10 * 60 * 1000 });
  if (result.allowed) return null;
  const response = apiError(429, "rate_limited", "Too many attempts. Try again in a few minutes.");
  response.headers.set("Retry-After", String(result.retryAfterSeconds));
  return response;
}

/**
 * GET /api/clips/link?url=… — looks up a pasted Twitch clip or YouTube video
 * so the form can show its title, thumbnail and length before submitting.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, "unauthorized", "Sign in before entering a clip.");
  try {
    const tooMany = await limited("clip-link-lookup", user._id.toHexString(), 40);
    if (tooMany) return tooMany;
    const clip = await lookupClipLink(request.nextUrl.searchParams.get("url"));
    const body: LinkPreviewResponse = {
      preview: {
        platform: clip.platform,
        id: clip.id,
        url: clip.url,
        title: clip.title,
        channelName: clip.channelName,
        thumbnailUrl: clip.thumbnailUrl,
        durationSeconds: clip.durationSeconds,
      },
      ownChannelRequired: isOwnChannelRequired(clip.platform),
      fromYourChannel: isFromOwnChannel(user, clip),
    };
    return apiJson(body);
  } catch (error) {
    return handleRouteError(error, "GET /api/clips/link");
  }
}

/**
 * POST /api/clips/link — enters a clip by link. Body: { url, title?, description?, challengeId? }.
 * The clip goes straight to `pending_review`, the same moderation queue as uploads.
 */
export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return apiError(403, "forbidden", "Invalid request origin.");
  const user = await getCurrentUser(request);
  if (!user) return apiError(401, "unauthorized", "Sign in before entering a clip.");

  const body = await readJsonBody(request);
  if (!body) return apiError(400, "bad_request", "Request body must be a JSON object.");

  const issues: ValidationIssue[] = [];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (body.title !== undefined && typeof body.title !== "string") issues.push({ field: "title", message: "Title must be text." });
  if (title.length > TITLE_MAX_LENGTH) issues.push({ field: "title", message: `Title must be at most ${TITLE_MAX_LENGTH} characters.` });
  if (body.description !== undefined && body.description !== null && typeof body.description !== "string") {
    issues.push({ field: "description", message: "Description must be text." });
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    issues.push({ field: "description", message: `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters.` });
  }
  const rawChallengeId = body.challengeId ?? null;
  if (rawChallengeId !== null && (typeof rawChallengeId !== "string" || !CHALLENGE_ID_PATTERN.test(rawChallengeId))) {
    issues.push({ field: "challengeId", message: "Invalid challenge." });
  }
  if (typeof body.url !== "string" || !body.url.trim()) issues.push({ field: "url", message: "Paste a Twitch or YouTube link." });
  if (issues.length > 0) return apiError(422, "validation_failed", "Please fix the highlighted fields.", issues);
  const challengeId = rawChallengeId as string | null;

  try {
    const tooMany = await limited("clip-link-submit", user._id.toHexString(), 10);
    if (tooMany) return tooMany;
    if (challengeId) {
      const challenge = await getPublicChallenge(challengeId);
      if (!challenge || !isChallengeOpen(challenge)) {
        return apiError(422, "validation_failed", "This challenge is not accepting submissions.", [
          { field: "challengeId", message: "Choose an active challenge." },
        ]);
      }
    }

    const clip = await lookupClipLink(body.url);
    const problem = ownershipProblem(user, clip);
    if (problem) return apiError(403, "forbidden", problem, [{ field: "url", message: problem }]);

    const created = await createLinkClip({ user, clip, title, description, challengeId });
    const id = created._id.toString();
    if (isAutoAiReviewEnabled()) {
      after(() => runAiModeration(id).catch((e) => console.error("[clips] AI review failed:", e)));
    }
    return apiJson({ clip: toOwnerClip(created) }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateLinkClipError) {
      return apiError(409, "conflict", error.message, [{ field: "url", message: error.message }]);
    }
    return handleRouteError(error, "POST /api/clips/link");
  }
}
