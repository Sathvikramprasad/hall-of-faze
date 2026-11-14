import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { NextRequest, NextResponse } from "next/server";
import type { HydratedDocument } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import UserModel, { type IUser } from "@/models/User";
import SessionModel from "@/models/Session";
import type { AccountUser, Role } from "@/types";

const scrypt = promisify(scryptCallback);
export const SESSION_COOKIE = "hof_session";
const SESSION_DAYS = 7;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return "scrypt:" + salt + ":" + hash.toString("hex");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, encoded, extra] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !encoded || extra) return false;
  const expected = Buffer.from(encoded, "hex");
  if (expected.length !== 64) return false;
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return timingSafeEqual(expected, actual);
}

export function serializeUser(user: HydratedDocument<IUser>): AccountUser {
  return {
    id: user._id.toHexString(),
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    socialLinks: {
      ...(user.socialLinks?.twitch ? { twitch: user.socialLinks.twitch } : {}),
      ...(user.socialLinks?.youtube ? { youtube: user.socialLinks.youtube } : {}),
    },
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function startSession(response: NextResponse, userId: IUser["_id"]) {
  const token = randomBytes(32).toString("base64url");
  await SessionModel.create({
    userId,
    tokenHash: digest(token),
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE * 1000),
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession(request: NextRequest, response: NextResponse) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) await SessionModel.deleteOne({ tokenHash: digest(token) });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Returns null unless the session token is valid and the account exists. */
export async function getCurrentUser(request: NextRequest): Promise<HydratedDocument<IUser> | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 200) return null;
  await connectDB();
  const session = await SessionModel.findOne({
    tokenHash: digest(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;
  return UserModel.findById(session.userId);
}

export async function requireRole(request: NextRequest, role: Role) {
  const user = await getCurrentUser(request);
  return user && (user.role === role || (role === "user" && user.role === "moderator"))
    ? user
    : null;
}

export async function requireModerator(request: NextRequest) {
  return requireRole(request, "moderator");
}
