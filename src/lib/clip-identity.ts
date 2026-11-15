import { cookies } from "next/headers";
import { getUserFromSessionToken, SESSION_COOKIE } from "@/lib/auth";

export type Viewer = {
  /** Stable id for the current visitor, or null if they have none yet. */
  userId: string | null;
  isModerator: boolean;
};

export async function getViewer(): Promise<Viewer> {
  const jar = await cookies();
  const user = await getUserFromSessionToken(jar.get(SESSION_COOKIE)?.value);
  return {
    userId: user?._id.toHexString() ?? null,
    isModerator: user?.role === "moderator",
  };
}

/** Returns the authenticated uploader id, or null for signed-out visitors. */
export async function ensureUploaderId(): Promise<string | null> {
  const viewer = await getViewer();
  return viewer.userId;
}

/** Label recorded in moderation history. */
export function moderatorLabel(viewer: Viewer): string {
  return viewer.userId ? `moderator:${viewer.userId}` : "moderator";
}
