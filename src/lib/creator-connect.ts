/**
 * "Connect Twitch" / "Connect YouTube": proves a user owns a channel by having
 * them sign in there. Server-only. We keep the account id and name, never the
 * sign-in token (it's revoked right after reading who signed in).
 */
import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { ClipPlatform } from "@/lib/creator-links";
import { isTwitchConfigured, twitchAuthorizeUrl } from "@/lib/twitch";
import { googleAuthorizeUrl, isGoogleOAuthConfigured } from "@/lib/youtube";

export const CONNECT_STATE_COOKIE = "hof_connect_state";
const STATE_MAX_AGE_SECONDS = 10 * 60;

export function isPlatform(value: string): value is ClipPlatform {
  return value === "twitch" || value === "youtube";
}

export function isConnectAvailable(platform: ClipPlatform): boolean {
  return platform === "twitch" ? isTwitchConfigured() : isGoogleOAuthConfigured();
}

/**
 * The callback address registered with Twitch / Google. APP_URL (e.g.
 * https://hall-of-faze.example) overrides the request's own origin when the app
 * runs behind a proxy that rewrites it.
 */
export function connectRedirectUri(request: NextRequest, platform: ClipPlatform): string {
  const origin = (process.env.APP_URL || request.nextUrl.origin).replace(/\/+$/, "");
  return `${origin}/api/connect/${platform}/callback`;
}

/** Redirects to Twitch / Google with a one-time `state` that the callback must echo back. */
export function startConnect(request: NextRequest, platform: ClipPlatform): NextResponse {
  const state = `${platform}.${randomBytes(24).toString("base64url")}`;
  const redirectUri = connectRedirectUri(request, platform);
  const authorizeUrl = platform === "twitch" ? twitchAuthorizeUrl(redirectUri, state) : googleAuthorizeUrl(redirectUri, state);
  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(CONNECT_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // sent on the top-level redirect back from Twitch / Google
    path: "/api/connect",
    maxAge: STATE_MAX_AGE_SECONDS,
  });
  return response;
}

/** The callback's `state` must match the cookie set when the flow started (CSRF protection). */
export function stateMatches(request: NextRequest, platform: ClipPlatform): boolean {
  const expected = request.cookies.get(CONNECT_STATE_COOKIE)?.value ?? "";
  const received = request.nextUrl.searchParams.get("state") ?? "";
  if (!expected.startsWith(`${platform}.`) || expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export function clearConnectState(response: NextResponse) {
  response.cookies.set(CONNECT_STATE_COOKIE, "", { httpOnly: true, path: "/api/connect", maxAge: 0 });
}
