import { connection } from "next/server";
import { communityFail, communityOk } from "@/lib/community-http";
import { listActiveChallenges } from "@/lib/community-data";

export async function GET() {
  await connection();
  try {
    const challenges = await listActiveChallenges();
    return communityOk({ challenges, serverTime: new Date().toISOString() });
  } catch (error) {
    console.error("Active challenge lookup failed:", error);
    return communityFail(500, "INTERNAL_ERROR", "Unable to load active challenges.");
  }
}
