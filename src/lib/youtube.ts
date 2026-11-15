/**
 * YouTube Data API v3 client. Server-only.
 *
 * Env: YOUTUBE_API_KEY for public lookups. "Connect YouTube" also needs
 * GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.
 *
 * Quota: every call here costs 1 unit of the default 10,000 a day. The
 * 100-unit search endpoint is never used, and results are cached.
 */
import { cached } from "@/lib/ttl-cache";
import { parseIsoDuration, type YouTubeChannelRef } from "@/lib/creator-links";
import { ExternalServiceError, fetchExternal, type ExternalClip } from "@/lib/external-api";

const API = "https://www.googleapis.com/youtube/v3";
const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE = "https://oauth2.googleapis.com/revoke";

export function isYouTubeConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY);
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

async function youtube<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new ExternalServiceError("not_configured", "YouTube isn't set up on this server yet.");
  const res = await fetchExternal("YouTube", `${API}/${path}?${new URLSearchParams({ ...params, key })}`);
  const body = (await res.json().catch(() => ({}))) as {
    items?: T[];
    error?: { errors?: { reason?: string }[] };
  };
  if (!res.ok) {
    const reason = body.error?.errors?.[0]?.reason;
    if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
      throw new ExternalServiceError("unavailable", "YouTube's daily lookup limit for this site has been reached. Try again tomorrow.");
    }
    if (res.status === 400 || res.status === 403) {
      throw new ExternalServiceError("not_configured", "YouTube rejected the API key. Check YOUTUBE_API_KEY and that YouTube Data API v3 is enabled.");
    }
    throw new ExternalServiceError("unavailable", `YouTube's API returned an error (${res.status}). Try again in a moment.`);
  }
  return body.items ?? [];
}

type Thumbs = Partial<Record<"default" | "medium" | "high" | "standard" | "maxres", { url: string }>>;
const bestThumb = (t: Thumbs | undefined) =>
  t?.maxres?.url ?? t?.standard?.url ?? t?.high?.url ?? t?.medium?.url ?? t?.default?.url ?? "";

/* ------------------------------------------------------------------ */
/* Videos                                                              */
/* ------------------------------------------------------------------ */

type ApiVideo = {
  id: string;
  snippet: {
    title: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    liveBroadcastContent: string;
    thumbnails: Thumbs;
  };
  contentDetails: { duration: string };
  status: { embeddable: boolean; privacyStatus: string };
};

export async function getYouTubeVideo(id: string): Promise<ExternalClip> {
  const [video] = await cached(`yt:video:${id}`, 10 * 60_000, () =>
    youtube<ApiVideo>("videos", { part: "snippet,contentDetails,status", id }),
  );
  if (!video) throw new ExternalServiceError("not_found", "That YouTube video doesn't exist or is private.");
  if (video.snippet.liveBroadcastContent !== "none") {
    throw new ExternalServiceError("unsupported", "Live streams and premieres can't be entered. Link the clip once it's uploaded.");
  }
  if (!video.status.embeddable) {
    throw new ExternalServiceError("unsupported", "The channel doesn't allow this video to be played on other sites.");
  }
  return {
    platform: "youtube",
    id: video.id,
    title: video.snippet.title,
    url: `https://www.youtube.com/watch?v=${video.id}`,
    channelId: video.snippet.channelId,
    channelName: video.snippet.channelTitle,
    thumbnailUrl: bestThumb(video.snippet.thumbnails) || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
    durationSeconds: parseIsoDuration(video.contentDetails.duration),
    publishedAt: video.snippet.publishedAt ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Channels                                                            */
/* ------------------------------------------------------------------ */

export type YouTubeUpload = { id: string; title: string; publishedAt: string; thumbnailUrl: string; url: string };

export type YouTubeChannel = {
  id: string;
  title: string;
  handle: string | null;
  url: string;
  thumbnailUrl: string;
  /** Null when the channel hides it. YouTube rounds public counts (e.g. 29.7M). */
  subscriberCount: number | null;
  videoCount: number;
  latestUploads: YouTubeUpload[];
};

type ApiChannel = {
  id: string;
  snippet: { title: string; customUrl?: string; thumbnails: Thumbs };
  statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean; videoCount?: string };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
};

type ApiPlaylistItem = {
  snippet: { title: string; publishedAt: string; thumbnails: Thumbs; resourceId?: { videoId?: string } };
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
};

function refParams(ref: YouTubeChannelRef): Record<string, string> {
  if (ref.kind === "id") return { id: ref.value };
  if (ref.kind === "handle") return { forHandle: ref.value };
  return { forUsername: ref.value };
}

/** Channel stats plus its latest uploads; cached for 10 minutes. Null if the channel doesn't exist. */
export async function getYouTubeChannel(ref: YouTubeChannelRef, uploads = 3): Promise<YouTubeChannel | null> {
  return cached(`yt:channel:${ref.kind}:${ref.value.toLowerCase()}:${uploads}`, 10 * 60_000, async () => {
    const [channel] = await youtube<ApiChannel>("channels", { part: "snippet,statistics,contentDetails", ...refParams(ref) });
    if (!channel) return null;

    let latestUploads: YouTubeUpload[] = [];
    const playlistId = channel.contentDetails?.relatedPlaylists?.uploads;
    if (playlistId && uploads > 0) {
      const items = await youtube<ApiPlaylistItem>("playlistItems", {
        part: "snippet,contentDetails",
        playlistId,
        maxResults: String(Math.min(uploads, 10)),
      }).catch(() => [] as ApiPlaylistItem[]); // stats still show if the upload list fails
      latestUploads = items
        .map((item) => {
          const id = item.contentDetails?.videoId ?? item.snippet.resourceId?.videoId ?? "";
          return {
            id,
            title: item.snippet.title,
            publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet.publishedAt,
            thumbnailUrl: item.snippet.thumbnails?.medium?.url ?? bestThumb(item.snippet.thumbnails),
            url: `https://www.youtube.com/watch?v=${id}`,
          };
        })
        .filter((v) => v.id && v.title !== "Private video" && v.title !== "Deleted video");
    }

    const stats = channel.statistics;
    const handle = channel.snippet.customUrl?.startsWith("@") ? channel.snippet.customUrl : null;
    return {
      id: channel.id,
      title: channel.snippet.title,
      handle,
      url: handle ? `https://www.youtube.com/${handle}` : `https://www.youtube.com/channel/${channel.id}`,
      thumbnailUrl: channel.snippet.thumbnails?.medium?.url ?? bestThumb(channel.snippet.thumbnails),
      subscriberCount: stats?.hiddenSubscriberCount || !stats?.subscriberCount ? null : Number(stats.subscriberCount),
      videoCount: Number(stats?.videoCount ?? 0),
      latestUploads,
    };
  });
}

/* ------------------------------------------------------------------ */
/* "Connect YouTube" (Google OAuth, read-only, one-time)               */
/* ------------------------------------------------------------------ */

const YOUTUBE_READONLY = "https://www.googleapis.com/auth/youtube.readonly";

function oauthCredentials() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ExternalServiceError("not_configured", "YouTube sign-in isn't set up on this server yet.");
  }
  return { clientId, clientSecret };
}

export function googleAuthorizeUrl(redirectUri: string, state: string): string {
  const { clientId } = oauthCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: YOUTUBE_READONLY,
    access_type: "online", // no refresh token: we read the channel once and forget the token
    include_granted_scopes: "false",
    prompt: "select_account",
    state,
  });
  return `${GOOGLE_AUTH}?${params}`;
}

export type OwnedYouTubeChannel = { id: string; title: string; handle: string | null };

/** Trades the sign-in code for the YouTube channel the signed-in Google account owns. */
export async function youtubeChannelFromCode(code: string, redirectUri: string): Promise<OwnedYouTubeChannel> {
  const { clientId, clientSecret } = oauthCredentials();
  const res = await fetchExternal("Google", GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const token = (await res.json().catch(() => ({}))) as { access_token?: string; scope?: string };
  if (!res.ok || !token.access_token) {
    throw new ExternalServiceError("unavailable", "Google didn't accept the sign-in. Try connecting again.");
  }
  try {
    if (token.scope && !token.scope.split(" ").includes(YOUTUBE_READONLY)) {
      throw new ExternalServiceError("unsupported", "Allow access to your YouTube account so we can see which channel is yours.");
    }
    const me = await fetchExternal("YouTube", `${API}/channels?part=snippet&mine=true`, {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const body = (await me.json().catch(() => ({}))) as { items?: ApiChannel[] };
    if (!me.ok) throw new ExternalServiceError("unavailable", "Couldn't read your YouTube channel. Try again.");
    const channel = body.items?.[0];
    if (!channel) throw new ExternalServiceError("not_found", "That Google account doesn't have a YouTube channel.");
    return {
      id: channel.id,
      title: channel.snippet.title,
      handle: channel.snippet.customUrl?.startsWith("@") ? channel.snippet.customUrl : null,
    };
  } finally {
    void fetchExternal("Google", `${GOOGLE_REVOKE}?${new URLSearchParams({ token: token.access_token })}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).catch(() => undefined);
  }
}
