import mongoose, { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { isChallengeOpen, isVotingRoundKey, rankLeaderboardEntries } from "@/lib/community-rules";
import Challenge, { type ChallengePrize, type IChallenge } from "@/models/Challenge";
import { sponsoredTitle } from "@/lib/sponsor";
import Vote from "@/models/Vote";
import { isClipVoteEligible } from "@/lib/clips";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

type LeanChallenge = IChallenge & { _id: Types.ObjectId };

export type PublicChallenge = {
  id: string;
  slug: string;
  title: string;
  /** Title shown to users; sponsored challenges are named after their sponsor. */
  displayTitle: string;
  description: string;
  gameIds: string[];
  rules: string[];
  eligibilitySummary: string;
  prizeSummary: string;
  sponsorName: string | null;
  prizes: ChallengePrize[];
  howToWin: string[];
  selectionPolicy: "community_vote";
  status: IChallenge["status"];
  roundKey: string;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
};

export type LeaderboardEntry = {
  rank: number;
  clipId: string;
  challengeId: string;
  uploaderId: string;
  title: string;
  voteCount: number;
  thumbnailUrl: string;
  videoUrl: string;
  approvedAt: string;
};

type ClipRecord = {
  _id: Types.ObjectId;
  challengeId: string | null;
  uploaderId: string;
  title: string;
  status: string;
  approvedAt: Date | null;
};

export class VoteValidationError extends Error {
  constructor(
    readonly code: "invalid_input" | "not_found" | "challenge_closed" | "clip_ineligible" | "duplicate_vote",
    message: string,
  ) {
    super(message);
    this.name = "VoteValidationError";
  }
}

function toPublicChallenge(challenge: LeanChallenge): PublicChallenge {
  return {
    id: challenge._id.toHexString(),
    slug: challenge.slug,
    title: challenge.title,
    displayTitle: sponsoredTitle({ title: challenge.title, sponsorName: challenge.sponsorName ?? null }),
    description: challenge.description,
    gameIds: challenge.gameIds ?? [],
    rules: challenge.rules ?? [],
    eligibilitySummary: challenge.eligibilitySummary,
    prizeSummary: challenge.prizeSummary ?? "",
    sponsorName: challenge.sponsorName ?? null,
    prizes: (challenge.prizes ?? []).map(({ place, reward }) => ({ place, reward })),
    howToWin: challenge.howToWin ?? [],
    selectionPolicy: challenge.selectionPolicy,
    status: challenge.status,
    roundKey: challenge.roundKey,
    startsAt: new Date(challenge.startsAt).toISOString(),
    endsAt: new Date(challenge.endsAt).toISOString(),
    createdAt: new Date(challenge.createdAt).toISOString(),
    updatedAt: new Date(challenge.updatedAt).toISOString(),
  };
}

export async function listActiveChallenges(at = new Date()): Promise<PublicChallenge[]> {
  await connectDB();
  const challenges = await Challenge.find({
    status: "active",
    startsAt: { $lte: at },
    endsAt: { $gt: at },
  })
    .sort({ endsAt: 1, title: 1 })
    .lean<LeanChallenge[]>()
    .exec();
  return challenges.map(toPublicChallenge);
}

export async function getPublicChallenge(identifier: string): Promise<PublicChallenge | null> {
  await connectDB();
  const filter = OBJECT_ID_PATTERN.test(identifier)
    ? { _id: new Types.ObjectId(identifier) }
    : { slug: identifier.toLowerCase() };
  const challenge = await Challenge.findOne({ ...filter, status: { $ne: "draft" } })
    .lean<LeanChallenge>()
    .exec();
  return challenge ? toPublicChallenge(challenge) : null;
}

export async function getChallengeLeaderboard(
  challengeId: string,
  roundKey: string,
  limit = 3,
): Promise<LeaderboardEntry[]> {
  if (!OBJECT_ID_PATTERN.test(challengeId) || !isVotingRoundKey(roundKey)) return [];
  await connectDB();

  const clips = await mongoose.connection.collection<ClipRecord>("clips")
    .find({
      challengeId,
      status: "approved",
      approvedAt: { $ne: null },
    })
    .project<ClipRecord>({
      _id: 1,
      challengeId: 1,
      uploaderId: 1,
      title: 1,
      status: 1,
      approvedAt: 1,
    })
    .limit(200)
    .toArray();
  if (clips.length === 0) return [];

  const clipIds = clips.map((clip) => clip._id.toHexString());
  const counts = await Vote.aggregate<{ _id: string; voteCount: number }>([
    { $match: { challengeId, votingRound: roundKey, clipId: { $in: clipIds } } },
    { $group: { _id: "$clipId", voteCount: { $sum: 1 } } },
  ]).exec();
  const countByClip = new Map(counts.map((row) => [row._id, row.voteCount]));

  const entries = clips
    .filter((clip): clip is ClipRecord & { approvedAt: Date } => clip.approvedAt instanceof Date)
    .map((clip) => {
      const clipId = clip._id.toHexString();
      return {
        clipId,
        challengeId,
        uploaderId: clip.uploaderId,
        title: clip.title,
        voteCount: countByClip.get(clipId) ?? 0,
        thumbnailUrl: `/api/clips/${clipId}/media/thumbnail`,
        videoUrl: `/api/clips/${clipId}/media/video`,
        approvedAt: clip.approvedAt.toISOString(),
      };
    });

  return rankLeaderboardEntries(entries).slice(0, Math.min(Math.max(1, limit), 50));
}

export async function castVote(input: {
  voterId: string;
  clipId: string;
  challengeId: string;
  at?: Date;
}) {
  if (
    !OBJECT_ID_PATTERN.test(input.voterId) ||
    !OBJECT_ID_PATTERN.test(input.clipId) ||
    !OBJECT_ID_PATTERN.test(input.challengeId)
  ) {
    throw new VoteValidationError("invalid_input", "Vote identifiers must be valid IDs.");
  }

  await connectDB();
  const challenge = await Challenge.findById(input.challengeId).lean<LeanChallenge>().exec();
  if (!challenge) throw new VoteValidationError("not_found", "Challenge not found.");
  if (!isChallengeOpen(challenge, input.at ?? new Date())) {
    throw new VoteValidationError("challenge_closed", "This challenge is not accepting votes.");
  }

  if (!(await isClipVoteEligible(input.clipId, input.challengeId))) {
    throw new VoteValidationError(
      "clip_ineligible",
      "Only approved clips entered in this challenge can receive votes.",
    );
  }

  try {
    await Vote.init();
    const vote = await Vote.create({
      voterId: input.voterId,
      clipId: input.clipId,
      challengeId: input.challengeId,
      votingRound: challenge.roundKey,
    });
    return {
      id: vote._id.toHexString(),
      voterId: vote.voterId,
      clipId: vote.clipId,
      challengeId: vote.challengeId,
      votingRound: vote.votingRound,
      createdAt: vote.createdAt.toISOString(),
    };
  } catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === 11000) {
      throw new VoteValidationError(
        "duplicate_vote",
        "You already voted for this clip in the current round.",
      );
    }
    throw error;
  }
}
