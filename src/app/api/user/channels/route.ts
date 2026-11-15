import { connection, type NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { getCurrentUser, serializeConnections } from "@/lib/auth";
import { isConnectAvailable } from "@/lib/creator-connect";
import { getChannelStats } from "@/lib/creator-data";
import { twitchLoginFromProfile, youtubeChannelFromProfile, type YouTubeChannelRef } from "@/lib/creator-links";
import { isOwnChannelRequired } from "@/lib/link-clips";
import { isTwitchConfigured } from "@/lib/twitch";
import { isYouTubeConfigured } from "@/lib/youtube";

/**
 * GET /api/user/channels — the signed-in user's Twitch / YouTube channels for
 * My Profile: what's linked or verified, whether they're live, current YouTube
 * stats, and which integrations this server has set up.
 */
export async function GET(request: NextRequest) {
  await connection();
  try {
    const user = await getCurrentUser(request);
    if (!user) return fail(401, "UNAUTHENTICATED", "Sign in to continue.");

    const connections = serializeConnections(user);
    const twitchLogin = connections.twitch?.login ?? twitchLoginFromProfile(user.socialLinks?.twitch);
    const youtubeRef: YouTubeChannelRef | null = connections.youtube
      ? { kind: "id", value: connections.youtube.channelId }
      : youtubeChannelFromProfile(user.socialLinks?.youtube);
    const stats = await getChannelStats({ twitch: twitchLogin, youtube: youtubeRef });

    return ok({
      twitch: {
        lookupsAvailable: isTwitchConfigured(),
        connectAvailable: isConnectAvailable("twitch"),
        ownChannelRequiredForLinks: isOwnChannelRequired("twitch"),
        login: twitchLogin,
        live: stats.live,
      },
      youtube: {
        lookupsAvailable: isYouTubeConfigured(),
        connectAvailable: isConnectAvailable("youtube"),
        ownChannelRequiredForLinks: isOwnChannelRequired("youtube"),
        channel: stats.youtube,
      },
    });
  } catch (error) {
    console.error("Channel lookup failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to load your channels.");
  }
}
