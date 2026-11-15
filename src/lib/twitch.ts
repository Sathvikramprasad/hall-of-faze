/**
 * Twitch Helix client. Server-only.
 *
 * Env: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET (from dev.twitch.tv/console/apps).
 * Public lookups use an app access token (client-credentials flow), cached
 * until it expires. "Connect Twitch" uses the authorization-code flow with no
 * scopes: we only read who signed in, then revoke the token.
 */
import { cached } from "@/lib/ttl-cache";
import { ExternalServiceError, fetchExternal, type ExternalClip } from "@/lib/external-api";

const HELIX = "https://api.twitch.tv/helix";
const ID = "https://id.twitch.tv/oauth2";

export function isTwitchConfigured(): boolean {
  return Boolean(process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET);
}

function credentials() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new ExternalServiceError("not_configured", "Twitch isn't set up on this server yet.");
  }
  return { clientId, clientSecret };
}

let appToken: { value: string; expiresAt: number } | null = null;

async function getAppToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && appToken && appToken.expiresAt > Date.now()) return appToken.value;
  const { clientId, clientSecret } = credentials();
  const res = await fetchExternal("Twitch", `${ID}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number };
  if (!res.ok || !body.access_token) {
    throw new ExternalServiceError(
      res.status === 400 || res.status === 403 ? "not_configured" : "unavailable",
      res.status === 400 || res.status === 403
        ? "Twitch rejected the client ID or secret. Check TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET."
        : "Couldn't sign in to Twitch's API. Try again in a moment.",
    );
  }
  // Refresh a minute early so a token never expires mid-request.
  appToken = { value: body.access_token, expiresAt: Date.now() + Math.max(60, (body.expires_in ?? 3600) - 60) * 1000 };
  return appToken.value;
}

async function helix<T>(path: string, params: [string, string][]): Promise<T[]> {
  const { clientId } = credentials();
  const url = `${HELIX}/${path}?${new URLSearchParams(params)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getAppToken(attempt > 0);
    const res = await fetchExternal("Twitch", url, {
      headers: { "Client-Id": clientId, Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 && attempt === 0) continue; // token revoked or expired early
    if (!res.ok) {
      throw new ExternalServiceError("unavailable", `Twitch's API returned an error (${res.status}). Try again in a moment.`);
    }
    const body = (await res.json().catch(() => ({}))) as { data?: T[] };
    return body.data ?? [];
  }
  throw new ExternalServiceError("unavailable", "Twitch's API rejected our token.");
}

/* ------------------------------------------------------------------ */
/* Clips                                                               */
/* ------------------------------------------------------------------ */

type HelixClip = {
  id: string;
  url: string;
  broadcaster_id: string;
  broadcaster_name: string;
  title: string;
  thumbnail_url: string;
  duration: number;
  created_at: string;
};

export async function getTwitchClip(slug: string): Promise<ExternalClip> {
  const [clip] = await cached(`twitch:clip:${slug}`, 10 * 60_000, () => helix<HelixClip>("clips", [["id", slug]]));
  if (!clip) throw new ExternalServiceError("not_found", "That Twitch clip doesn't exist or was deleted.");
  return {
    platform: "twitch",
    id: clip.id,
    title: clip.title,
    url: clip.url || `https://clips.twitch.tv/${clip.id}`,
    channelId: clip.broadcaster_id,
    channelName: clip.broadcaster_name,
    thumbnailUrl: clip.thumbnail_url,
    durationSeconds: typeof clip.duration === "number" ? Math.round(clip.duration * 10) / 10 : null,
    publishedAt: clip.created_at ?? null,
  };
}

/* ------------------------------------------------------------------ */
/* Channels and live streams                                           */
/* ------------------------------------------------------------------ */

export type TwitchUser = { id: string; login: string; displayName: string; profileImageUrl: string };

export type LiveStream = {
  login: string;
  displayName: string;
  title: string;
  gameName: string;
  viewerCount: number;
  startedAt: string;
  thumbnailUrl: string;
};

type HelixUser = { id: string; login: string; display_name: string; profile_image_url: string };
type HelixStream = {
  user_login: string;
  user_name: string;
  title: string;
  game_name: string;
  viewer_count: number;
  started_at: string;
  thumbnail_url: string;
  type: string;
};

const uniqueLogins = (logins: string[]) => [...new Set(logins.map((l) => l.toLowerCase()))].slice(0, 100).sort();

export async function getTwitchUsers(logins: string[]): Promise<Map<string, TwitchUser>> {
  const list = uniqueLogins(logins);
  if (list.length === 0) return new Map();
  const users = await cached(`twitch:users:${list.join(",")}`, 60 * 60_000, () =>
    helix<HelixUser>("users", list.map((login) => ["login", login])),
  );
  return new Map(
    users.map((u) => [u.login, { id: u.id, login: u.login, displayName: u.display_name, profileImageUrl: u.profile_image_url }]),
  );
}

/** Which of these channels are live right now (cached for a minute and a half). */
export async function getLiveStreams(logins: string[]): Promise<LiveStream[]> {
  const list = uniqueLogins(logins);
  if (list.length === 0) return [];
  const streams = await cached(`twitch:live:${list.join(",")}`, 90_000, () =>
    helix<HelixStream>("streams", [["type", "live"], ["first", "100"], ...list.map((login) => ["user_login", login] as [string, string])]),
  );
  return streams
    .filter((s) => s.type === "live")
    .map((s) => ({
      login: s.user_login,
      displayName: s.user_name,
      title: s.title,
      gameName: s.game_name,
      viewerCount: s.viewer_count,
      startedAt: s.started_at,
      thumbnailUrl: s.thumbnail_url.replace("{width}", "640").replace("{height}", "360"),
    }))
    .sort((a, b) => b.viewerCount - a.viewerCount);
}

/* ------------------------------------------------------------------ */
/* "Connect Twitch" (authorization-code flow)                          */
/* ------------------------------------------------------------------ */

export function twitchAuthorizeUrl(redirectUri: string, state: string): string {
  const { clientId } = credentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "", // no permissions: we only need to know which account signed in
    state,
    force_verify: "true",
  });
  return `${ID}/authorize?${params}`;
}

/** Trades the sign-in code for the Twitch account that approved it, then revokes the token. */
export async function twitchAccountFromCode(code: string, redirectUri: string): Promise<TwitchUser> {
  const { clientId, clientSecret } = credentials();
  const res = await fetchExternal("Twitch", `${ID}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const token = (await res.json().catch(() => ({}))) as { access_token?: string };
  if (!res.ok || !token.access_token) {
    throw new ExternalServiceError("unavailable", "Twitch didn't accept the sign-in. Try connecting again.");
  }
  try {
    const me = await fetchExternal("Twitch", `${HELIX}/users`, {
      headers: { "Client-Id": clientId, Authorization: `Bearer ${token.access_token}` },
    });
    const body = (await me.json().catch(() => ({}))) as { data?: HelixUser[] };
    const user = body.data?.[0];
    if (!me.ok || !user) throw new ExternalServiceError("unavailable", "Couldn't read your Twitch account. Try again.");
    return { id: user.id, login: user.login, displayName: user.display_name, profileImageUrl: user.profile_image_url };
  } finally {
    // We never store user tokens; revoke this one straight away.
    void fetchExternal("Twitch", `${ID}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, token: token.access_token }),
    }).catch(() => undefined);
  }
}
