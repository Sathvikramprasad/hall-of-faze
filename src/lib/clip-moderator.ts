import { apiError } from "@/lib/clip-http";
import { getViewer, type Viewer } from "@/lib/clip-identity";

/** Returns the moderator viewer, or a 401 response to return from the route. */
export async function requireModerator(): Promise<
  { viewer: Viewer; denied: null } | { viewer: null; denied: ReturnType<typeof apiError> }
> {
  const viewer = await getViewer();
  if (!viewer.isModerator) {
    return { viewer: null, denied: apiError(401, "unauthorized", "Moderator sign-in required.") };
  }
  return { viewer, denied: null };
}
