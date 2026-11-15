import { createHash } from "node:crypto";
import mongoose, { Types } from "mongoose";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";

const SESSION_COOKIE = "hof_session";

type SessionRecord = {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
};

/**
 * Compatibility adapter for Soham's session contract. Once the backend branch
 * lands, replace this raw collection lookup with getCurrentUser(request).
 */
export async function getCommunityUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 200) return null;

  await connectDB();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const session = await mongoose.connection.collection<SessionRecord>("sessions").findOne(
    { tokenHash, expiresAt: { $gt: new Date() } },
    { projection: { userId: 1 } },
  );
  if (!session?.userId) return null;

  const userId = session.userId instanceof Types.ObjectId
    ? session.userId
    : new Types.ObjectId(String(session.userId));
  const user = await mongoose.connection.collection("users").findOne(
    { _id: userId },
    { projection: { _id: 1 } },
  );
  return user ? userId.toHexString() : null;
}
