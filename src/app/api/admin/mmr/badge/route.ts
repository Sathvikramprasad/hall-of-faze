import mongoose from "mongoose";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasValidOrigin, fail, ok, parseObject } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import Challenge from "@/models/Challenge";
import MmrSettlement from "@/models/MmrSettlement";
import MmrResult from "@/models/MmrResult";

export async function PATCH(request: NextRequest) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid origin.");
  try {
    const user = await getCurrentUser(request);
    if (!user || user.role !== "moderator") return fail(403, "FORBIDDEN", "Moderator access required.");
    const body = await parseObject(request);
    if (!body || typeof body.challengeId !== "string" || !/^[a-f\d]{24}$/i.test(body.challengeId)) return fail(400, "INVALID_INPUT", "Valid challengeId required.");
    const challengeId = body.challengeId;
    const artwork = body.artworkUrl;
    if (typeof artwork !== "string" || artwork.length > 2048) return fail(400, "INVALID_INPUT", "An HTTPS artwork URL is required.");
    let url: URL;
    try { url = new URL(artwork); } catch { return fail(400, "INVALID_INPUT", "Invalid artwork URL."); }
    if (url.protocol !== "https:" || url.username || url.password) return fail(400, "INVALID_INPUT", "Artwork must use HTTPS without credentials.");
    await connectDB();
    await MmrSettlement.init();
    const result = await mongoose.connection.transaction(async session => {
      const challenge = await Challenge.findById(challengeId).session(session).lean().exec();
      if (!challenge) throw new Error("Challenge not found.");
      const key = { challengeId, roundKey: challenge.roundKey };
      if (await MmrSettlement.exists(key).session(session) || await MmrResult.exists(key).session(session)) throw new Error("Settled badge artwork cannot be changed.");
      await Challenge.updateOne({ _id: challenge._id }, { $set: { championBadgeUrl: url.href }, $inc: { mmrSettlementVersion: 1 } }, { session, runValidators: true });
      return { artworkUrl: url.href };
    });
    return ok(result);
  } catch (error) {
    return fail(409, "CONFLICT", error instanceof Error ? error.message : "Unable to save artwork.");
  }
}
