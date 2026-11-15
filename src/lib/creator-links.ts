/**
 * Twitch and YouTube link rules shared by the browser and the server.
 *
 * Pure module (no Node, Next.js or database imports) so the upload form,
 * route handlers and unit tests all parse links the same way.
 */

export type ClipPlatform = "twitch" | "youtube";

export type ParsedClipLink = { platform: ClipPlatform; id: string };

const TWITCH_CLIP_SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]{2,99}$/;
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const TWITCH_LOGIN = /^[a-z0-9_]{3,25}$/;

function toUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 500) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

function host(url: URL): string {
  return url.hostname.toLowerCase().replace(/^(www|m)\./, "");
}

/**
 * Recognises a Twitch clip or a YouTube video / Short link and returns its id.
 *
 * Twitch: clips.twitch.tv/<slug>, twitch.tv/<channel>/clip/<slug>, clips.twitch.tv/embed?clip=<slug>
 * YouTube: youtube.com/watch?v=<id>, youtu.be/<id>, youtube.com/shorts/<id>, /live/<id>, /embed/<id>
 */
export function parseClipLink(input: string): ParsedClipLink | null {
  const url = toUrl(input);
  if (!url) return null;
  const h = host(url);
  const parts = url.pathname.split("/").filter(Boolean);

  if (h === "clips.twitch.tv") {
    const slug = parts[0] === "embed" ? url.searchParams.get("clip") : parts[0];
    return slug && TWITCH_CLIP_SLUG.test(slug) && parts.length <= 1 + Number(parts[0] === "embed")
      ? { platform: "twitch", id: slug }
      : null;
  }
  if (h === "twitch.tv") {
    // twitch.tv/<channel>/clip/<slug>, or m.twitch.tv/clip/<slug> from the mobile site
    if (parts.length === 3 && parts[1] === "clip" && TWITCH_CLIP_SLUG.test(parts[2])) {
      return { platform: "twitch", id: parts[2] };
    }
    if (parts.length === 2 && parts[0] === "clip" && TWITCH_CLIP_SLUG.test(parts[1])) {
      return { platform: "twitch", id: parts[1] };
    }
    return null;
  }

  if (h === "youtu.be") {
    return parts.length === 1 && YOUTUBE_VIDEO_ID.test(parts[0]) ? { platform: "youtube", id: parts[0] } : null;
  }
  if (h === "youtube.com" || h === "music.youtube.com" || h === "youtube-nocookie.com") {
    if (parts[0] === "watch" && parts.length === 1) {
      const v = url.searchParams.get("v");
      return v && YOUTUBE_VIDEO_ID.test(v) ? { platform: "youtube", id: v } : null;
    }
    if (["shorts", "live", "embed"].includes(parts[0]) && parts.length === 2 && YOUTUBE_VIDEO_ID.test(parts[1])) {
      return { platform: "youtube", id: parts[1] };
    }
  }
  return null;
}

/** Canonical page for a clip, used for "Watch on Twitch/YouTube" links. */
export function clipPageUrl(link: ParsedClipLink): string {
  return link.platform === "twitch"
    ? `https://clips.twitch.tv/${encodeURIComponent(link.id)}`
    : `https://www.youtube.com/watch?v=${encodeURIComponent(link.id)}`;
}

/**
 * Embed URL for a clip. Twitch refuses to load unless `parent` is the domain the
 * page is served from, so callers pass `window.location.hostname`.
 */
export function clipEmbedUrl(link: ParsedClipLink, parentHost: string): string {
  if (link.platform === "twitch") {
    const params = new URLSearchParams({ clip: link.id, parent: parentHost, autoplay: "false" });
    return `https://clips.twitch.tv/embed?${params}`;
  }
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(link.id)}?rel=0`;
}

/** Live channel player. Muted so it never autoplays sound on someone's page. */
export function twitchChannelEmbedUrl(login: string, parentHost: string): string {
  const params = new URLSearchParams({ channel: login, parent: parentHost, muted: "true", autoplay: "true" });
  return `https://player.twitch.tv/?${params}`;
}

/** Seconds in an ISO-8601 duration as YouTube returns it (e.g. "PT1M5S"). Null if unparseable. */
export function parseIsoDuration(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value);
  if (!match || value === "P" || value.endsWith("T")) return null;
  const [, d, h, m, s] = match;
  return Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}

/** "1:05", "12:00", "1:02:03". */
export function formatClipLength(seconds: number | null | undefined): string | null {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return null;
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** 1234 → "1.2K", 29_700_000 → "29.7M". */
export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  if (value < 1000) return String(Math.round(value));
  const units: [number, string][] = [[1e9, "B"], [1e6, "M"], [1e3, "K"]];
  for (const [size, suffix] of units) {
    if (value >= size) {
      const scaled = value / size;
      return `${scaled >= 100 ? Math.round(scaled) : Number(scaled.toFixed(1))}${suffix}`;
    }
  }
  return String(value);
}

/* ------------------------------------------------------------------ */
/* Profile links (socialLinks) → API lookups                            */
/* ------------------------------------------------------------------ */

/** Twitch login from a stored profile link such as https://www.twitch.tv/name. */
export function twitchLoginFromProfile(link: string | null | undefined): string | null {
  const url = link ? toUrl(link) : null;
  if (!url || host(url) !== "twitch.tv") return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const login = parts.length === 1 ? parts[0].toLowerCase() : "";
  return TWITCH_LOGIN.test(login) ? login : null;
}

/** How to find a YouTube channel from a stored profile link. */
export type YouTubeChannelRef =
  | { kind: "id"; value: string }
  | { kind: "handle"; value: string }
  | { kind: "username"; value: string };

export function youtubeChannelFromProfile(link: string | null | undefined): YouTubeChannelRef | null {
  const url = link ? toUrl(link) : null;
  if (!url || host(url) !== "youtube.com") return null;
  let parts: string[];
  try {
    parts = url.pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  } catch {
    return null;
  }
  if (parts.length === 1 && parts[0].startsWith("@") && parts[0].length > 1) {
    return { kind: "handle", value: parts[0] };
  }
  if (parts.length === 2 && parts[0] === "channel" && /^UC[A-Za-z0-9_-]{22}$/.test(parts[1])) {
    return { kind: "id", value: parts[1] };
  }
  if (parts.length === 2 && parts[0] === "user") return { kind: "username", value: parts[1] };
  // /c/<custom> links can only be resolved through the 100-unit search endpoint, so they're skipped.
  return null;
}
