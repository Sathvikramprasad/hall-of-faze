/**
 * Identity + roles for the clip feature.
 *
 * TEMPORARY ADAPTER — this is the single place to swap in the shared auth from
 * the backend branch (issue #1: `src/lib/auth.ts`, `user` / `moderator` roles).
 * Until then:
 *   - uploaders get a random, httpOnly "guest id" cookie, so they can see and
 *     manage their own unapproved uploads;
 *   - moderators sign in with MODERATOR_ACCESS_KEY, which issues a signed,
 *     httpOnly session cookie.
 * Every clip route asks this module, so replacing it does not touch the routes.
 *
 * Server-only module.
 */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const GUEST_COOKIE = "hof_guest_id";
const MODERATOR_COOKIE = "hof_moderator";
const MODERATOR_SESSION_SECONDS = 12 * 60 * 60;
const GUEST_ID_PATTERN = /^guest_[0-9a-f-]{36}$/;

export type Viewer = {
  /** Stable id for the current visitor, or null if they have none yet. */
  userId: string | null;
  isModerator: boolean;
};

const secureCookies = process.env.NODE_ENV === "production";

export async function getViewer(): Promise<Viewer> {
  const jar = await cookies();
  const guest = jar.get(GUEST_COOKIE)?.value;
  return {
    userId: guest && GUEST_ID_PATTERN.test(guest) ? guest : null,
    isModerator: verifyModeratorSession(jar.get(MODERATOR_COOKIE)?.value),
  };
}

/** Returns the current uploader id, creating a guest id cookie if needed. Route handlers / server actions only. */
export async function ensureUploaderId(): Promise<string> {
  const viewer = await getViewer();
  if (viewer.userId) return viewer.userId;
  const id = `guest_${randomUUID()}`;
  const jar = await cookies();
  jar.set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

/* ------------------------------------------------------------------ */
/* Moderator session                                                   */
/* ------------------------------------------------------------------ */

function moderatorKey(): string | null {
  const key = process.env.MODERATOR_ACCESS_KEY;
  return key && key.length >= 12 ? key : null;
}

export function isModeratorLoginConfigured(): boolean {
  return moderatorKey() !== null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(`hof-moderator:${payload}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function verifyModeratorSession(value: string | undefined): boolean {
  const key = moderatorKey();
  if (!key || !value) return false;
  const [expires, signature] = value.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires)) return false;
  if (Number(expires) * 1000 < Date.now()) return false;
  return safeEqual(signature, sign(expires, key));
}

/** Checks the access key and, if correct, sets the moderator cookie. */
export async function signInModerator(accessKey: unknown): Promise<boolean> {
  const key = moderatorKey();
  if (!key || typeof accessKey !== "string") return false;
  // Compare HMACs so the comparison is constant-time regardless of length.
  if (!safeEqual(sign(accessKey, key), sign(key, key))) return false;

  const expires = String(Math.floor(Date.now() / 1000) + MODERATOR_SESSION_SECONDS);
  const jar = await cookies();
  jar.set(MODERATOR_COOKIE, `${expires}.${sign(expires, key)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: secureCookies,
    path: "/",
    maxAge: MODERATOR_SESSION_SECONDS,
  });
  return true;
}

export async function signOutModerator(): Promise<void> {
  const jar = await cookies();
  jar.delete(MODERATOR_COOKIE);
}

/** Label recorded in moderation history. */
export function moderatorLabel(viewer: Viewer): string {
  return viewer.userId ? `moderator:${viewer.userId}` : "moderator";
}
