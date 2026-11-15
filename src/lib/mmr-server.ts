import { connectDB } from "@/lib/mongodb";
import { NEW_RATING, applyDelta, decayRating, normalizeRating, placementDelta, type Rating } from "@/lib/mmr-rules";
import MmrResult from "@/models/MmrResult";
import Challenge from "@/models/Challenge";
import { getChallengeLeaderboard } from "@/lib/community-data";

export type MmrBadge = { challengeId: string; title: string; sponsor: string; color: string; icon: string; awardedAt: string };

export async function getPlayerMmr(userId: string, now = new Date()) {
  await connectDB();
  const results = await MmrResult.find({ userId }).sort({ awardedAt: 1, _id: 1 }).lean().exec();
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
    awardedAt: r.awardedAt.toISOString(),
  }));
  return { rating: normalizeRating(rating), badges, challengesPlayed: results.length, wins: badges.length };
}

/** Moderator-triggered, once-only settlement after a challenge closes.
 * Existing results are never recalculated silently: this keeps MMR auditable.
 */
export async function settleChallengeMmr(challengeId: string, now = new Date()) {
  await connectDB();
  const challenge = await Challenge.findById(challengeId).lean().exec();
  if (!challenge) throw new Error("Challenge not found");
  if (challenge.endsAt.getTime() > now.getTime()) throw new Error("Challenge voting is still open");
  if (challenge.status === "draft") throw new Error("Draft challenges cannot be settled");
  const existing = await MmrResult.countDocuments({ challengeId, roundKey: challenge.roundKey });
  if (existing > 0) throw new Error("This challenge round has already been settled");
  const entries = await getChallengeLeaderboard(challengeId, challenge.roundKey, 200);
  // Each player gets their best eligible clip; multiple clips cannot multiply MMR rewards.
  const bestByPlayer = new Map<string, (typeof entries)[number]>();
  for (const entry of entries) if (!bestByPlayer.has(entry.uploaderId)) bestByPlayer.set(entry.uploaderId, entry);
  const players = [...bestByPlayer.values()].sort((a, b) => b.voteCount - a.voteCount || a.approvedAt.localeCompare(b.approvedAt) || a.clipId.localeCompare(b.clipId));
  const topVotes = players[0]?.voteCount ?? 0;
  const awardedAt = new Date(Math.max(challenge.endsAt.getTime(), 0));
  const records = players.map((entry, index) => ({
    challengeId, roundKey: challenge.roundKey, userId: entry.uploaderId,
    place: index + 1, participants: players.length, votes: entry.voteCount, topVotes,
    delta: placementDelta({ place: index + 1, participants: players.length, votes: entry.voteCount, topVotes }),
    awardedAt, challengeTitle: challenge.title,
    sponsorName: challenge.sponsorName ?? null, badgeColor: null, badgeIcon: null,
  }));
  if (records.length) await MmrResult.insertMany(records, { ordered: true });
  return { settled: records.length, challengeId, roundKey: challenge.roundKey };
}
