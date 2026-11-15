import type { NextRequest } from "next/server";
import { getCommunityUserId } from "@/lib/community-auth";
import { castVote, VoteValidationError } from "@/lib/community-data";
import {
  communityFail,
  communityOk,
  hasValidCommunityOrigin,
  parseCommunityObject,
} from "@/lib/community-http";

export async function POST(request: NextRequest) {
  if (!hasValidCommunityOrigin(request)) {
    return communityFail(403, "FORBIDDEN", "Invalid request origin.");
  }

  let voterId: string | null;
  try {
    voterId = await getCommunityUserId(request);
  } catch (error) {
    console.error("Vote authentication lookup failed:", error);
    return communityFail(503, "DEPENDENCY_UNAVAILABLE", "Voting is temporarily unavailable.");
  }
  if (!voterId) return communityFail(401, "UNAUTHENTICATED", "Sign in before voting.");

  const body = await parseCommunityObject(request);
  if (!body) return communityFail(400, "INVALID_INPUT", "Expected a JSON object.");
  const clipId = typeof body.clipId === "string" ? body.clipId.trim() : "";
  const challengeId = typeof body.challengeId === "string" ? body.challengeId.trim() : "";
  if (!clipId || !challengeId) {
    return communityFail(400, "INVALID_INPUT", "clipId and challengeId are required.");
  }

  try {
    const vote = await castVote({ voterId, clipId, challengeId });
    return communityOk({ vote }, 201);
  } catch (error) {
    if (error instanceof VoteValidationError) {
      if (error.code === "invalid_input") return communityFail(400, "INVALID_INPUT", error.message);
      if (error.code === "not_found") return communityFail(404, "NOT_FOUND", error.message);
      return communityFail(409, "CONFLICT", error.message);
    }
    console.error("Vote creation failed:", error);
    return communityFail(500, "INTERNAL_ERROR", "Unable to record the vote.");
  }
}
