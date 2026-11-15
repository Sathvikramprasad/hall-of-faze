import { connection } from "next/server";
import { apiJson } from "@/lib/clip-http";
import { getViewer } from "@/lib/clip-identity";

/** GET — is the current visitor a moderator? */
export async function GET() {
  await connection();
  const viewer = await getViewer();
  return apiJson({ isAuthenticated: viewer.userId !== null, isModerator: viewer.isModerator });
}
