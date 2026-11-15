/**
 * Live status and channel stats for the Home page, Vault member pages and
 * My Profile. Server-only. Every lookup fails soft: if Twitch or YouTube isn't
 * configured or doesn't answer, the section just doesn't show that data.
 */
import { getMembers } from "@/lib/vault/queries";
import type { MemberProfile } from "@/lib/vault/types";
import { getLiveStreams, isTwitchConfigured, type LiveStream } from "@/lib/twitch";
import { getYouTubeChannel, isYouTubeConfigured, type YouTubeChannel } from "@/lib/youtube";
import type { YouTubeChannelRef } from "@/lib/creator-links";

/** FaZe's own Twitch channel, followed by Vault members who stream. */
export function liveChannelList(): { login: string; label: string; href: string | null }[] {
  return [
    { login: "faze", label: "FaZe Clan", href: null },
    ...getMembers()
      .filter((m) => m.channels?.twitch)
      .map((m) => ({ login: m.channels!.twitch!.toLowerCase(), label: m.handle, href: `/vault/members/${m.slug}` })),
  ];
}

export type LiveNowEntry = LiveStream & { label: string; href: string | null };

export type LiveNow =
  | { status: "not_configured" }
  | { status: "unavailable" }
  | { status: "ok"; live: LiveNowEntry[]; channels: { login: string; label: string; href: string | null }[] };

export async function getLiveNow(): Promise<LiveNow> {
  if (!isTwitchConfigured()) return { status: "not_configured" };
  const channels = liveChannelList();
  try {
    const streams = await getLiveStreams(channels.map((c) => c.login));
    const byLogin = new Map(channels.map((c) => [c.login, c]));
    return {
      status: "ok",
      channels,
      live: streams.map((s) => ({ ...s, label: byLogin.get(s.login)?.label ?? s.displayName, href: byLogin.get(s.login)?.href ?? null })),
    };
  } catch (error) {
    console.error("[live-now] Twitch lookup failed:", error instanceof Error ? error.message : error);
    return { status: "unavailable" };
  }
}

export type ChannelStats = {
  youtube: YouTubeChannel | null;
  live: LiveStream | null;
  /** True when at least one lookup was possible (keys set and channels known). */
  available: boolean;
};

/** Current YouTube stats and Twitch live status for a set of channels. */
export async function getChannelStats(
  refs: { twitch?: string | null; youtube?: YouTubeChannelRef | null },
  uploads = 3,
): Promise<ChannelStats> {
  const canTwitch = Boolean(refs.twitch && isTwitchConfigured());
  const canYouTube = Boolean(refs.youtube && isYouTubeConfigured());
  const [youtube, live] = await Promise.all([
    canYouTube
      ? getYouTubeChannel(refs.youtube!, uploads).catch((error) => {
          console.error("[channels] YouTube lookup failed:", error instanceof Error ? error.message : error);
          return null;
        })
      : null,
    canTwitch
      ? getLiveStreams([refs.twitch!])
          .then((streams) => streams[0] ?? null)
          .catch((error) => {
            console.error("[channels] Twitch lookup failed:", error instanceof Error ? error.message : error);
            return null;
          })
      : null,
  ]);
  return { youtube, live, available: canTwitch || canYouTube };
}

export function memberChannelRefs(member: MemberProfile): { twitch: string | null; youtube: YouTubeChannelRef | null } {
  const c = member.channels;
  return {
    twitch: c?.twitch ?? null,
    youtube: c?.youtubeChannelId
      ? { kind: "id", value: c.youtubeChannelId }
      : c?.youtubeHandle
        ? { kind: "handle", value: c.youtubeHandle }
        : null,
  };
}
