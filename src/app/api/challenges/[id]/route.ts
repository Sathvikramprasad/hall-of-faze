import type { NextRequest } from "next/server";
import { communityFail, communityOk } from "@/lib/community-http";
import { getPublicChallenge } from "@/lib/community-data";

export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/challenges/[id]">,
) {
  const { id } = await context.params;
  try {
    const challenge = await getPublicChallenge(id);
    if (!challenge) return communityFail(404, "NOT_FOUND", "Challenge not found.");
    return communityOk({ challenge });
  } catch (error) {
    console.error("Challenge lookup failed:", error);
    return communityFail(500, "INTERNAL_ERROR", "Unable to load this challenge.");
  }
}
