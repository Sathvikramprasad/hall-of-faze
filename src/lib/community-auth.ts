import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/** Shared account-session adapter used by the voting routes. */
export async function getCommunityUserId(request: NextRequest): Promise<string | null> {
  const user = await getCurrentUser(request);
  return user?._id.toHexString() ?? null;
}
