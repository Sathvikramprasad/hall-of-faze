import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPlayerMmr } from "@/lib/mmr-server";
import { fail, ok } from "@/lib/api";
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return fail(401, "UNAUTHENTICATED", "Sign in to view your rank.");
    return ok(await getPlayerMmr(user._id.toHexString()));
  } catch (error) {
    console.error("MMR lookup failed", error);
    return fail(500, "INTERNAL_ERROR", "Unable to load rank.");
  }
}
