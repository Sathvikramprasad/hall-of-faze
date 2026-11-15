import type { NextRequest } from "next/server";
import { communityFail, communityOk } from "@/lib/community-http";
import { getChallengeLeaderboard, getPublicChallenge } from "@/lib/community-data";
import { isVotingRoundKey } from "@/lib/community-rules";

export async function GET(request: NextRequest) {
  const challengeId = request.nextUrl.searchParams.get("challengeId")?.trim() ?? "";
  if (!challengeId) {
    return communityFail(400, "INVALID_INPUT", "challengeId is required.");
  }

  const requestedRound = request.nextUrl.searchParams.get("round")?.trim();
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? "3");
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(1, Math.floor(requestedLimit)), 50) : 3;

  try {
    const challenge = await getPublicChallenge(challengeId);
    if (!challenge) return communityFail(404, "NOT_FOUND", "Challenge not found.");
    const roundKey = requestedRound || challenge.roundKey;
    if (!isVotingRoundKey(roundKey)) {
      return communityFail(400, "INVALID_INPUT", "round must use YYYY-MM.");
    }
    const entries = await getChallengeLeaderboard(challenge.id, roundKey, limit);
    return communityOk({ challenge, roundKey, entries });
  } catch (error) {
    console.error("Leaderboard lookup failed:", error);
    return communityFail(500, "INTERNAL_ERROR", "Unable to load the leaderboard.");
  }
}
