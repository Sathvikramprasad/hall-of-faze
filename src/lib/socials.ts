import type { SocialLinks } from "@/types";

function socialUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 200) throw new Error("Invalid social profile URL.");
  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : "https://" + trimmed);
  } catch {
    throw new Error("Invalid social profile URL.");
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) {
    throw new Error("Social links must be HTTPS profile URLs.");
  }
  if (url.search || url.hash) throw new Error("Social profile links cannot contain query parameters.");
  return url;
}

export function normalizeTwitch(value: string): string {
  const url = socialUrl(value);
  if (!["twitch.tv", "www.twitch.tv"].includes(url.hostname.toLowerCase())) {
    throw new Error("Enter a twitch.tv profile URL.");
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 1 || !/^[a-zA-Z0-9_]{4,25}$/.test(parts[0])) {
    throw new Error("Enter a valid Twitch username.");
  }
  const name = parts[0].toLowerCase();
  if (["directory", "downloads", "settings", "videos", "subscriptions"].includes(name)) {
    throw new Error("Enter a Twitch creator profile, not a site page.");
  }
  return "https://www.twitch.tv/" + name;
}

export function normalizeYouTube(value: string): string {
  const url = socialUrl(value);
  if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname.toLowerCase())) {
    throw new Error("Enter a youtube.com channel URL.");
  }
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 1 && /^@[a-zA-Z0-9._-]{3,30}$/.test(parts[0])) {
    return "https://www.youtube.com/" + parts[0];
  }
  if (parts.length === 2 && parts[0] === "channel" && /^UC[a-zA-Z0-9_-]{22}$/.test(parts[1])) {
    return "https://www.youtube.com/channel/" + parts[1];
  }
  if (parts.length === 2 && ["c", "user"].includes(parts[0]) && /^[a-zA-Z0-9._-]{3,60}$/.test(parts[1])) {
    return "https://www.youtube.com/" + parts[0] + "/" + parts[1];
  }
  throw new Error("Enter a YouTube channel URL or @handle, not a video.");
}

export function normalizeSocialLinks(links: { twitch?: string | null; youtube?: string | null }): SocialLinks {
  const result: SocialLinks = {};
  if (links.twitch) result.twitch = normalizeTwitch(links.twitch);
  if (links.youtube) result.youtube = normalizeYouTube(links.youtube);
  return result;
}
