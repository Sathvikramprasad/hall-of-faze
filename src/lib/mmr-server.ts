import mongoose from "mongoose";
import MmrSettlement from "@/models/MmrSettlement";
import { connectDB } from "@/lib/mongodb";
import { NEW_RATING, applyDelta, decayRating, normalizeRating, placementDelta, type Rating } from "@/lib/mmr-rules";
import MmrResult, { type IMmrResult } from "@/models/MmrResult";
import Challenge from "@/models/Challenge";
import { getChallengeLeaderboard } from "@/lib/community-data";

export type MmrBadge = { challengeId: string; title: string; sponsor: string; color: string; icon: string; artworkUrl: string | null; awardedAt: string };

export async function getPlayerMmr(userId: string, now = new Date()) {
  await connectDB();
  if (!/^[a-f\d]{24}$/i.test(userId)) throw new Error("Invalid player ID");
  const results = await MmrResult.aggregate<IMmrResult>([
    { $match: { userId: userId.toLowerCase() } },
    { $lookup: {
      from: MmrSettlement.collection.name,
      let: { challenge: "$challengeId", round: "$roundKey" },
      pipeline: [{ $match: { $expr: { $and: [{ $eq: ["$challengeId", "$$challenge"] }, { $eq: ["$roundKey", "$$round"] }] } } }],
      as: "settlement",
    } },
    { $match: { "settlement.0": { $exists: true } } },
    { $sort: { awardedAt: 1, challengeId: 1, roundKey: 1 } },
    { $project: { settlement: 0 } },
  ]).exec();
  let rating: Rating = { ...NEW_RATING };
  for (const result of results) {
    rating = decayRating(rating, result.awardedAt);
    rating = applyDelta(rating, result.delta);
    rating.lastActiveAt = result.awardedAt.toISOString();
    rating.lastDecayAt = null;
  }
  rating = decayRating(rating, now);
  const badges: MmrBadge[] = results.filter((r) => r.place === 1).map((r) => ({
    challengeId: r.challengeId,
    title: r.challengeTitle,
    sponsor: r.sponsorName ?? "Hall of FaZe",
    color: r.badgeColor ?? "#ff1744",
    icon: r.badgeIcon ?? "★",
    artworkUrl: r.badgeUrl ?? null,
    awardedAt: r.awardedAt.toISOString(),
  }));
  return { rating: normalizeRating(rating), badges, challengesPlayed: results.length, wins: badges.length };
}

/** A snapshot transaction publishes the marker and every player's result together.
 * The challenge write serializes concurrent settlers. Unique indexes are ready
 * before starting; retries return the original result, including empty rounds.
 * MongoDB must support transactions (replica set / Atlas); fail closed otherwise.
 */
export async function settleChallengeMmr(challengeId: string, now = new Date()) {
  if (!/^[a-f\d]{24}$/i.test(challengeId) || !Number.isFinite(now.getTime())) throw new Error("Invalid settlement input");
  challengeId = challengeId.toLowerCase();
  await connectDB();
  await Promise.all([MmrResult.init(), MmrSettlement.init()]);
  return mongoose.connection.transaction(async (session) => {
    const challenge = await Challenge.findById(challengeId).session(session).lean().exec();
    if (!challenge) throw new Error("Challenge not found");
    const key = { challengeId, roundKey: challenge.roundKey };
    const existing = await MmrSettlement.findOne(key).session(session).lean().exec();
    if (existing) return { ...key, settled: existing.participants, alreadySettled: true };
    if (challenge.endsAt.getTime() > now.getTime()) throw new Error("Challenge voting is still open");
    if (challenge.status === "draft") throw new Error("Draft challenges cannot be settled");
    // Never mistake an old partially inserted batch for a complete settlement.
    if (await MmrResult.exists(key).session(session)) {
      throw new Error("Legacy results require reconciliation before settlement; no results were changed");
    }
    await Challenge.updateOne({ _id: challenge._id }, { $inc: { mmrSettlementVersion: 1 } }, { session });
    const entries = await getChallengeLeaderboard(challengeId, challenge.roundKey, Infinity, {
      session, startsAt: challenge.startsAt, endsAt: challenge.endsAt,
    });
    // Entries are already sorted by votes, approval time, then clip ID.
    // A player's best clip counts once; other clips cannot push opponents down.
    const bestByPlayer = new Map<string, (typeof entries)[number]>();
    for (const entry of entries) if (!bestByPlayer.has(entry.uploaderId)) bestByPlayer.set(entry.uploaderId, entry);
    const players = [...bestByPlayer.values()];
    const topVotes = players[0]?.voteCount ?? 0;
    const records = players.map((entry, index) => ({
      ...key, userId: entry.uploaderId,
      place: index + 1, participants: players.length, votes: entry.voteCount, topVotes,
      delta: placementDelta({ place: index + 1, participants: players.length, votes: entry.voteCount, topVotes }),
      awardedAt: challenge.endsAt, challengeTitle: challenge.title,
      sponsorName: challenge.sponsorName ?? null, badgeColor: null, badgeIcon: null,
      badgeUrl: challenge.championBadgeUrl ?? null,
    }));
    if (records.length) await MmrResult.insertMany(records, { session, ordered: true });
    await MmrSettlement.create([{ ...key, participants: records.length, settledAt: now }], { session });
    return { ...key, settled: records.length, alreadySettled: false };
  }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } });
}

export type PlayerMmr = Awaited<ReturnType<typeof getPlayerMmr>>;
