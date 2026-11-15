import { connection, type NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { listProfileClips } from "@/lib/profile-clips";

/** GET — every clip the signed-in user has submitted (newest first), with its challenge. */
export async function GET(request: NextRequest) {
  await connection(); // per-user data: never prerender
  try {
    const user = await getCurrentUser(request);
    if (!user) return fail(401, "UNAUTHENTICATED", "Sign in to continue.");
    return ok({ clips: await listProfileClips(user._id.toHexString()) });
  } catch (error) {
    console.error("Profile clips lookup failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to load your clips.");
  }
}
