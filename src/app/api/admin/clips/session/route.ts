import { connection } from "next/server";
import { apiError, apiJson, readJsonBody } from "@/lib/clip-http";
import {
  getViewer,
  isModeratorLoginConfigured,
  signInModerator,
  signOutModerator,
} from "@/lib/clip-identity";

/** GET — is the current visitor a moderator? */
export async function GET() {
  await connection();
  const viewer = await getViewer();
  return apiJson({ isModerator: viewer.isModerator, loginConfigured: isModeratorLoginConfigured() });
}

/** POST { accessKey } — moderator sign-in (temporary until shared auth roles land). */
export async function POST(request: Request) {
  if (!isModeratorLoginConfigured()) {
    return apiError(503, "forbidden", "Moderator sign-in is not configured (set MODERATOR_ACCESS_KEY).");
  }
  const body = await readJsonBody(request);
  const ok = await signInModerator(body?.accessKey);
  if (!ok) {
    // Slow down guessing.
    await new Promise((resolve) => setTimeout(resolve, 750));
    return apiError(401, "unauthorized", "That access key is not correct.");
  }
  return apiJson({ isModerator: true });
}

/** DELETE — sign out. */
export async function DELETE() {
  await signOutModerator();
  return apiJson({ isModerator: false });
}
