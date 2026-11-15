import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasValidOrigin, fail, ok, parseObject } from "@/lib/api";
import { settleChallengeMmr } from "@/lib/mmr-server";
export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid origin.");
  const user = await getCurrentUser(request);
  if (!user || user.role !== "moderator") return fail(403, "FORBIDDEN", "Moderator access required.");
  const body = await parseObject(request);
  if (!body || typeof body.challengeId !== "string" || !/^[a-f\d]{24}$/i.test(body.challengeId)) return fail(400, "INVALID_INPUT", "Valid challengeId required.");
  try { return ok(await settleChallengeMmr(body.challengeId)); }
  catch (error) { return fail(409, "SETTLEMENT_FAILED", error instanceof Error ? error.message : "Could not settle challenge."); }
}
