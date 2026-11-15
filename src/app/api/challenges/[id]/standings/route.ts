import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { getPublicChallenge } from "@/lib/community-data";
import MmrSettlement from "@/models/MmrSettlement";
import MmrResult from "@/models/MmrResult";
import User from "@/models/User";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const challenge = await getPublicChallenge(id);
    if (!challenge) return fail(404, "NOT_FOUND", "Challenge not found.");
    const key = { challengeId: challenge.id, roundKey: challenge.roundKey };
    const settled = await MmrSettlement.findOne(key).lean().exec();
    const requested = Number(request.nextUrl.searchParams.get("page") ?? 1);
    const page = Number.isSafeInteger(requested) ? Math.max(1, Math.min(requested, Math.max(1, Math.ceil((settled?.participants ?? 0) / 50)))) : 1;
    if (!settled) return ok({ settled: false, entries: [], total: 0, page, pages: 0 });
    const results = await MmrResult.find(key).sort({ place: 1 }).skip((page - 1) * 50).limit(50).lean().exec();
    const users = await User.find({ _id: { $in: results.map(r => r.userId) } }).select("displayName").lean().exec();
    const names = new Map(users.map(user => [user._id.toHexString(), user.displayName]));
    return ok({ settled: true, total: settled.participants, page, pages: Math.ceil(settled.participants / 50), entries: results.map(r => ({ userId: r.userId, displayName: names.get(r.userId) ?? "Player", place: r.place, votes: r.votes, delta: r.delta })) });
  } catch (error) {
    console.error("Standings lookup failed", error);
    return fail(500, "INTERNAL_ERROR", "Unable to load standings.");
  }
}
