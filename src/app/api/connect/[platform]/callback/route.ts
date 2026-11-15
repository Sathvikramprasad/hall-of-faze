import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { clearConnectState, connectRedirectUri, isPlatform, stateMatches } from "@/lib/creator-connect";
import { ExternalServiceError } from "@/lib/external-api";
import { twitchAccountFromCode } from "@/lib/twitch";
import { youtubeChannelFromCode } from "@/lib/youtube";
import UserModel from "@/models/User";

type Context = { params: Promise<{ platform: string }> };

/**
 * GET /api/connect/{twitch|youtube}/callback — Twitch / Google send the user
 * back here. Saves which channel they own, then returns them to My Profile with
 * ?connected=… or ?connect_error=… for the page to explain.
 */
export async function GET(request: NextRequest, { params }: Context) {
  const { platform } = await params;
  const account = new URL("/account", request.nextUrl.origin);
  const back = (key: "connected" | "connect_error", value: string) => {
    account.searchParams.set(key, value);
    const response = NextResponse.redirect(account);
    clearConnectState(response);
    return response;
  };

  if (!isPlatform(platform)) return back("connect_error", "failed");
  if (!stateMatches(request, platform)) return back("connect_error", "expired");
  const query = request.nextUrl.searchParams;
  if (query.get("error")) return back("connect_error", "cancelled"); // the user clicked Cancel / Deny
  const code = query.get("code");
  if (!code) return back("connect_error", "failed");

  try {
    const user = await getCurrentUser(request);
    if (!user) return back("connect_error", "signed_out");
    const redirectUri = connectRedirectUri(request, platform);

    if (platform === "twitch") {
      const twitch = await twitchAccountFromCode(code, redirectUri);
      const taken = await UserModel.exists({ _id: { $ne: user._id }, "connections.twitch.id": twitch.id });
      if (taken) return back("connect_error", "taken");
      user.set("connections.twitch", { id: twitch.id, login: twitch.login, displayName: twitch.displayName, verifiedAt: new Date() });
      user.set("socialLinks.twitch", `https://www.twitch.tv/${twitch.login}`);
    } else {
      const channel = await youtubeChannelFromCode(code, redirectUri);
      const taken = await UserModel.exists({ _id: { $ne: user._id }, "connections.youtube.channelId": channel.id });
      if (taken) return back("connect_error", "taken");
      user.set("connections.youtube", { channelId: channel.id, title: channel.title, handle: channel.handle, verifiedAt: new Date() });
      user.set(
        "socialLinks.youtube",
        channel.handle ? `https://www.youtube.com/${encodeURI(channel.handle)}` : `https://www.youtube.com/channel/${channel.id}`,
      );
    }
    await user.save();
    return back("connected", platform);
  } catch (error) {
    if (error instanceof ExternalServiceError && error.kind === "not_found") return back("connect_error", "no_channel");
    console.error(`[connect] ${platform} callback failed:`, error instanceof Error ? error.message : error);
    return back("connect_error", "failed");
  }
}
