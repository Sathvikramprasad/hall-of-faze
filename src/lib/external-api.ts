/**
 * Errors and the normalized clip shape shared by the Twitch and YouTube clients.
 * Server-only.
 */
import type { ClipPlatform } from "@/lib/creator-links";

export type ExternalErrorKind = "not_configured" | "not_found" | "unavailable" | "unsupported";

export class ExternalServiceError extends Error {
  readonly kind: ExternalErrorKind;

  constructor(kind: ExternalErrorKind, message: string) {
    super(message);
    this.name = "ExternalServiceError";
    this.kind = kind;
  }
}

/** A Twitch clip or YouTube video, as looked up from its link. */
export type ExternalClip = {
  platform: ClipPlatform;
  id: string;
  title: string;
  url: string;
  /** Twitch broadcaster id or YouTube channel id: whose channel the clip comes from. */
  channelId: string;
  channelName: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
  publishedAt: string | null;
};

/** fetch with a timeout; network failures become ExternalServiceError("unavailable"). */
export async function fetchExternal(
  service: string,
  url: string,
  init: RequestInit = {},
  timeoutMs = 8000,
): Promise<Response> {
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
  } catch {
    throw new ExternalServiceError("unavailable", `${service} didn't respond. Try again in a moment.`);
  }
}
