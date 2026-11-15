import { NextResponse } from "next/server";
import { apiError, handleRouteError, isClipId } from "@/lib/clip-http";
import { getViewer } from "@/lib/clip-identity";
import { canViewClip, findClipById } from "@/lib/clips";
import { createDownloadUrl, THUMBNAIL_URL_TTL_SECONDS, VIDEO_URL_TTL_SECONDS } from "@/lib/storage";

type Context = { params: Promise<{ id: string; kind: string }> };

/**
 * GET /api/clips/{id}/media/{video|thumbnail}
 * Access-checked redirect to a short-lived signed storage URL. The bucket stays
 * private: processing / pending / rejected media is only reachable by the
 * uploader (after verification) and moderators.
 *
 * Clips entered by Twitch / YouTube link have nothing in storage: after the
 * same access check, they redirect to the platform's thumbnail and clip page.
 */
export async function GET(_request: Request, { params }: Context) {
  const { id, kind } = await params;
  if (!isClipId(id) || (kind !== "video" && kind !== "thumbnail")) {
    return apiError(404, "not_found", "Not found.");
  }
  try {
    const [clip, viewer] = await Promise.all([findClipById(id), getViewer()]);
    if (kind === "video" && !viewer.userId) {
      return apiError(401, "unauthorized", "Sign in to watch clips.");
    }
    if (!clip || !canViewClip(clip, viewer)) return apiError(404, "not_found", "Not found.");

    if (clip.source) {
      const target = kind === "video" ? clip.source.url : clip.source.thumbnailUrl;
      if (!target) return apiError(404, "not_found", "Not found.");
      return NextResponse.redirect(target, {
        status: 302,
        headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
      });
    }

    const media = kind === "video" ? clip.video : clip.thumbnail;
    if (!media?.key) return apiError(404, "not_found", "Not found.");
    const ttl = kind === "video" ? VIDEO_URL_TTL_SECONDS : THUMBNAIL_URL_TTL_SECONDS;
    const signed = createDownloadUrl(media.key, ttl, media.contentType);

    return NextResponse.redirect(signed, {
      status: 302,
      headers: {
        // Never let a shared cache keep a redirect to private media.
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    return handleRouteError(error, "GET /api/clips/[id]/media/[kind]");
  }
}
