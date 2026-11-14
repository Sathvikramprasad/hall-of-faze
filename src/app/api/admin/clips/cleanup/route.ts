import { apiJson, handleRouteError } from "@/lib/clip-http";
import { requireModerator } from "@/lib/clip-moderator";
import { cleanupAbandonedUploads } from "@/lib/clips";

/** POST /api/admin/clips/cleanup — deletes abandoned uploads (records + stored files). */
export async function POST() {
  const { denied } = await requireModerator();
  if (denied) return denied;
  try {
    let removed = 0;
    for (let i = 0; i < 10; i++) {
      const n = await cleanupAbandonedUploads();
      removed += n;
      if (n === 0) break;
    }
    return apiJson({ removed });
  } catch (error) {
    return handleRouteError(error, "POST /api/admin/clips/cleanup");
  }
}
