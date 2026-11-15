import "server-only";
import {
  normalizeTwitchLogins,
  selectYouTubeThumbnail,
  twitchStreamThumbnail,
  type YouTubeThumbnail,
} from "@/lib/live-pulse-utils";

/**
 * Server-only aggregation for the FaZe Live Pulse experience.
 *
 * YouTube: resolves the official channel's uploads playlist, then loads its
 * latest public uploads. Twitch: resolves the official FaZe Twitch team,
 * checks those channels for live streams, and keeps top clips available when
 * nobody is live. API credentials never leave this module.
 */

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";
const TWITCH_API = "https://api.twitch.tv/helix";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

const YOUTUBE_REVALIDATE_SECONDS = 15 * 60;
const TWITCH_LIVE_REVALIDATE_SECONDS = 2 * 60;
const TWITCH_DIRECTORY_REVALIDATE_SECONDS = 60 * 60;

export type PulseSourceStatus = "ready" | "unconfigured" | "unavailable";

export type YouTubePulseVideo = {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  channelTitle: string;
  url: string;
};

export type YouTubePulse = {
  status: PulseSourceStatus;
  channelTitle: string;
  channelUrl: string;
  subscriberCount: number | null;
  totalViews: number | null;
  videos: YouTubePulseVideo[];
};

export type TwitchLiveStream = {
  id: string;
  userId: string;
  userLogin: string;
  userName: string;
  title: string;
  gameName: string;
  viewerCount: number;
  thumbnailUrl: string;
  startedAt: string;
  url: string;
};

export type TwitchPulseClip = {
  id: string;
  broadcasterName: string;
  title: string;
  thumbnailUrl: string;
  viewCount: number;
  createdAt: string;
  duration: number;
  url: string;
};

export type TwitchPulse = {
  status: PulseSourceStatus;
  teamName: string;
  teamThumbnailUrl: string | null;
  trackedChannelCount: number;
  streams: TwitchLiveStream[];
  clips: TwitchPulseClip[];
};

export type LivePulse = {
  youtube: YouTubePulse;
  twitch: TwitchPulse;
  liveViewerCount: number;
  updatedAt: string;
};

type YouTubeChannelResponse = {
  items?: Array<{
    snippet?: { title?: string };
    contentDetails?: { relatedPlaylists?: { uploads?: string } };
    statistics?: { subscriberCount?: string; viewCount?: string; hiddenSubscriberCount?: boolean };
  }>;
  error?: { message?: string };
};

type YouTubePlaylistResponse = {
  items?: Array<{
    snippet?: {
      title?: string;
      publishedAt?: string;
      channelTitle?: string;
      resourceId?: { videoId?: string };
      thumbnails?: Record<string, YouTubeThumbnail>;
    };
    contentDetails?: { videoId?: string };
  }>;
  error?: { message?: string };
};

type TwitchTokenResponse = {
  access_token?: string;
  expires_in?: number;
  message?: string;
};

type TwitchTeamResponse = {
  data?: Array<{
    team_display_name?: string;
    thumbnail_url?: string | null;
    users?: Array<{ user_id?: string; user_login?: string; user_name?: string }>;
  }>;
  message?: string;
};

type TwitchUsersResponse = {
  data?: Array<{
    id?: string;
    login?: string;
    display_name?: string;
    profile_image_url?: string;
  }>;
  message?: string;
};

type TwitchStreamsResponse = {
  data?: Array<{
    id?: string;
    user_id?: string;
    user_login?: string;
    user_name?: string;
    game_name?: string;
    title?: string;
    viewer_count?: number;
    started_at?: string;
    thumbnail_url?: string;
  }>;
  message?: string;
};

type TwitchClipsResponse = {
  data?: Array<{
    id?: string;
    url?: string;
    broadcaster_name?: string;
    title?: string;
    thumbnail_url?: string;
    view_count?: number;
    created_at?: string;
    duration?: number;
  }>;
  message?: string;
};

type TwitchTokenCache = {
  clientId: string;
  token: string;
  expiresAt: number;
};

const globalForTwitch = globalThis as typeof globalThis & {
  hallOfFazeTwitchToken?: TwitchTokenCache;
};

function emptyYouTube(status: PulseSourceStatus): YouTubePulse {
  return {
    status,
    channelTitle: "FaZe Clan",
    channelUrl: "https://www.youtube.com/@FaZeClan",
    subscriberCount: null,
    totalViews: null,
    videos: [],
  };
}

function emptyTwitch(status: PulseSourceStatus): TwitchPulse {
  return {
    status,
    teamName: "FaZe Clan",
    teamThumbnailUrl: null,
    trackedChannelCount: 0,
    streams: [],
    clips: [],
  };
}

function positiveInteger(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

async function readJson<T>(response: Response, label: string): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
    message?: string;
  };
  if (!response.ok) {
    const message = data.error?.message ?? data.message ?? "unknown error";
    throw new Error(`${label} failed (${response.status}): ${message}`);
  }
  return data;
}

export async function getYouTubePulse(): Promise<YouTubePulse> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return emptyYouTube("unconfigured");

  const handle = process.env.YOUTUBE_CHANNEL_HANDLE?.trim() || "@FaZeClan";
  const channelParams = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    forHandle: handle,
    key: apiKey,
  });
  const channelResponse = await fetch(`${YOUTUBE_API}/channels?${channelParams}`, {
    next: { revalidate: YOUTUBE_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(10_000),
  });
  const channelData = await readJson<YouTubeChannelResponse>(channelResponse, "YouTube channel lookup");
  const channel = channelData.items?.[0];
  const uploads = channel?.contentDetails?.relatedPlaylists?.uploads;
  if (!channel || !uploads) throw new Error("YouTube did not return the FaZe uploads playlist.");

  const playlistParams = new URLSearchParams({
    part: "snippet,contentDetails",
    playlistId: uploads,
    maxResults: "6",
    key: apiKey,
  });
  const playlistResponse = await fetch(`${YOUTUBE_API}/playlistItems?${playlistParams}`, {
    next: { revalidate: YOUTUBE_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(10_000),
  });
  const playlistData = await readJson<YouTubePlaylistResponse>(playlistResponse, "YouTube uploads lookup");

  const videos: YouTubePulseVideo[] = [];
  for (const item of playlistData.items ?? []) {
    const id = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
    const thumbnailUrl = selectYouTubeThumbnail(item.snippet?.thumbnails);
    const title = item.snippet?.title?.trim();
    const publishedAt = item.snippet?.publishedAt;
    if (!id || !thumbnailUrl || !title || !publishedAt) continue;
    videos.push({
      id,
      title,
      publishedAt,
      thumbnailUrl,
      channelTitle: item.snippet?.channelTitle?.trim() || channel.snippet?.title || "FaZe Clan",
      url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
    });
  }

  const hidden = channel.statistics?.hiddenSubscriberCount === true;
  return {
    status: "ready",
    channelTitle: channel.snippet?.title?.trim() || "FaZe Clan",
    channelUrl: `https://www.youtube.com/${handle.startsWith("@") ? handle : `@${handle}`}`,
    subscriberCount: hidden ? null : positiveInteger(channel.statistics?.subscriberCount),
    totalViews: positiveInteger(channel.statistics?.viewCount),
    videos,
  };
}

async function getTwitchToken(clientId: string, clientSecret: string): Promise<string> {
  const cached = globalForTwitch.hallOfFazeTwitchToken;
  if (cached?.clientId === clientId && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });
  const response = await fetch(TWITCH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const data = await readJson<TwitchTokenResponse>(response, "Twitch authentication");
  if (!data.access_token || !data.expires_in) throw new Error("Twitch did not return an app token.");

  globalForTwitch.hallOfFazeTwitchToken = {
    clientId,
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function twitchGet<T>(
  path: string,
  clientId: string,
  token: string,
  revalidate: number,
  label: string,
): Promise<T> {
  const response = await fetch(`${TWITCH_API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Client-Id": clientId },
    next: { revalidate },
    signal: AbortSignal.timeout(10_000),
  });
  return readJson<T>(response, label);
}

function repeatedParams(name: string, values: string[]): string {
  const params = new URLSearchParams();
  for (const value of values) params.append(name, value);
  return params.toString();
}

export async function getTwitchPulse(): Promise<TwitchPulse> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return emptyTwitch("unconfigured");

  const token = await getTwitchToken(clientId, clientSecret);
  const teamName = process.env.TWITCH_TEAM_NAME?.trim().toLowerCase() || "faze";
  let team: NonNullable<TwitchTeamResponse["data"]>[number] | undefined;
  try {
    const teamData = await twitchGet<TwitchTeamResponse>(
      `/teams?${new URLSearchParams({ name: teamName })}`,
      clientId,
      token,
      TWITCH_DIRECTORY_REVALIDATE_SECONDS,
      "Twitch team lookup",
    );
    team = teamData.data?.[0];
  } catch (error) {
    // A Twitch team can be renamed or removed independently of its channels.
    // Keep the official FaZe channel working and let TWITCH_CHANNELS provide
    // additional creators instead of failing the entire provider.
    console.warn("[live-pulse] Twitch team directory unavailable; using channel fallback:", error);
  }
  const configuredLogins = (process.env.TWITCH_CHANNELS ?? "").split(",");
  const logins = normalizeTwitchLogins([
    "faze",
    ...(team?.users?.map((user) => user.user_login ?? "") ?? []),
    ...configuredLogins,
  ]);
  if (logins.length === 0) throw new Error("Twitch did not return any FaZe channels.");

  const [usersData, streamsData] = await Promise.all([
    twitchGet<TwitchUsersResponse>(
      `/users?${repeatedParams("login", logins)}`,
      clientId,
      token,
      TWITCH_DIRECTORY_REVALIDATE_SECONDS,
      "Twitch creator lookup",
    ),
    twitchGet<TwitchStreamsResponse>(
      `/streams?${repeatedParams("user_login", logins)}`,
      clientId,
      token,
      TWITCH_LIVE_REVALIDATE_SECONDS,
      "Twitch live lookup",
    ),
  ]);

  const streams: TwitchLiveStream[] = [];
  for (const stream of streamsData.data ?? []) {
    if (!stream.id || !stream.user_id || !stream.user_login || !stream.user_name) continue;
    streams.push({
      id: stream.id,
      userId: stream.user_id,
      userLogin: stream.user_login,
      userName: stream.user_name,
      title: stream.title?.trim() || "Live on Twitch",
      gameName: stream.game_name?.trim() || "Just Chatting",
      viewerCount: Number.isFinite(stream.viewer_count) ? Math.max(0, stream.viewer_count ?? 0) : 0,
      thumbnailUrl: twitchStreamThumbnail(stream.thumbnail_url),
      startedAt: stream.started_at || "",
      url: `https://www.twitch.tv/${encodeURIComponent(stream.user_login)}`,
    });
  }
  streams.sort((a, b) => b.viewerCount - a.viewerCount);

  const clipRequests = (usersData.data ?? []).slice(0, 5).flatMap((user) =>
    user.id
      ? [
          twitchGet<TwitchClipsResponse>(
            `/clips?${new URLSearchParams({ broadcaster_id: user.id, first: "3" })}`,
            clientId,
            token,
            TWITCH_DIRECTORY_REVALIDATE_SECONDS,
            `Twitch clips for ${user.display_name || user.login || "creator"}`,
          ).catch((): TwitchClipsResponse => ({ data: [] })),
        ]
      : [],
  );
  const clipResponses = await Promise.all(clipRequests);
  const clips: TwitchPulseClip[] = clipResponses
    .flatMap((response) => response.data ?? [])
    .flatMap((clip): TwitchPulseClip[] => {
      if (!clip.id || !clip.url || !clip.thumbnail_url || !clip.title) return [];
      return [{
        id: clip.id,
        broadcasterName: clip.broadcaster_name?.trim() || "FaZe creator",
        title: clip.title.trim(),
        thumbnailUrl: clip.thumbnail_url,
        viewCount: Number.isFinite(clip.view_count) ? Math.max(0, clip.view_count ?? 0) : 0,
        createdAt: clip.created_at || "",
        duration: Number.isFinite(clip.duration) ? Math.max(0, clip.duration ?? 0) : 0,
        url: clip.url,
      }];
    })
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 6);

  return {
    status: "ready",
    teamName: team?.team_display_name?.trim() || "FaZe Clan",
    teamThumbnailUrl: team?.thumbnail_url?.startsWith("https://") ? team.thumbnail_url : null,
    trackedChannelCount: usersData.data?.length ?? logins.length,
    streams,
    clips,
  };
}

export async function getLivePulse(): Promise<LivePulse> {
  const [youtubeResult, twitchResult] = await Promise.allSettled([
    getYouTubePulse(),
    getTwitchPulse(),
  ]);

  if (youtubeResult.status === "rejected") {
    console.error("[live-pulse] YouTube:", youtubeResult.reason);
  }
  if (twitchResult.status === "rejected") {
    console.error("[live-pulse] Twitch:", twitchResult.reason);
  }

  const youtube = youtubeResult.status === "fulfilled"
    ? youtubeResult.value
    : emptyYouTube("unavailable");
  const twitch = twitchResult.status === "fulfilled"
    ? twitchResult.value
    : emptyTwitch("unavailable");

  return {
    youtube,
    twitch,
    liveViewerCount: twitch.streams.reduce((sum, stream) => sum + stream.viewerCount, 0),
    updatedAt: new Date().toISOString(),
  };
}
