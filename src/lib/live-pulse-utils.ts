const MAX_TRACKED_TWITCH_CHANNELS = 24;

/**
 * Active Twitch channels for creators listed on FaZe's official People and
 * esports pages. Reviewed 2026-11-15. The API team response and the optional
 * TWITCH_CHANNELS variable can extend this list without duplicating entries.
 */
export const DEFAULT_FAZE_TWITCH_LOGINS = [
  "faze",
  "zoomaa",
  "swagg",
  "kaysan",
  "nickmercs",
  "booya",
  "faxuty",
  "mongraal",
] as const;

export type YouTubeThumbnail = { url?: string };

export function selectYouTubeThumbnail(
  thumbnails: Record<string, YouTubeThumbnail> | undefined,
): string | null {
  if (!thumbnails) return null;
  for (const key of ["maxres", "standard", "high", "medium", "default"]) {
    const value = thumbnails[key]?.url;
    if (value?.startsWith("https://")) return value;
  }
  return null;
}

export function twitchStreamThumbnail(template: string | undefined): string {
  if (!template?.startsWith("https://")) return "";
  return template.replace("{width}", "640").replace("{height}", "360");
}

export function normalizeTwitchLogins(values: string[]): string[] {
  const unique = new Set<string>();
  for (const value of values) {
    const login = value.trim().toLowerCase();
    if (/^[a-z0-9_]{3,25}$/.test(login)) unique.add(login);
    if (unique.size >= MAX_TRACKED_TWITCH_CHANNELS) break;
  }
  return [...unique];
}
