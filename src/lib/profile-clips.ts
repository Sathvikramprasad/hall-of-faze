/**
 * The signed-in user's own clips for the profile page. Server-only.
 */
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { sponsoredTitle } from "@/lib/sponsor";
import Challenge from "@/models/Challenge";
import Clip from "@/models/Clip";
import Vote from "@/models/Vote";
import type { ClipStatus } from "@/lib/clip-rules";
import { isChallengeLinkable } from "@/lib/profile-rules";

export type ProfileClip = {
  id: string;
  title: string;
  status: ClipStatus;
  rejectionReason: string | null;
  thumbnailUrl: string;
  voteCount: number;
  createdAt: string;
  /** Null when the clip wasn't entered in a challenge (or the challenge was removed). */
  challenge: {
    id: string;
    slug: string;
    title: string;
    /** False once the challenge has ended or closed; the profile then shows the name without a link. */
    open: boolean;
  } | null;
};

export async function listProfileClips(userId: string, now = new Date()): Promise<ProfileClip[]> {
  await connectDB();
  const clips = await Clip.find({ uploaderId: userId, status: { $ne: "processing" } })
    .select("title status challengeId moderation.rejectionReason createdAt")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean()
    .exec();
  if (clips.length === 0) return [];

  const challengeIds = [...new Set(clips.map((c) => c.challengeId).filter((id): id is string => Boolean(id && Types.ObjectId.isValid(id))))];
  const [challenges, votes] = await Promise.all([
    challengeIds.length
      ? Challenge.find({ _id: { $in: challengeIds.map((id) => new Types.ObjectId(id)) }, status: { $ne: "draft" } })
          .select("slug title sponsorName status endsAt")
          .lean()
          .exec()
      : [],
    Vote.aggregate<{ _id: string; count: number }>([
      { $match: { clipId: { $in: clips.map((c) => c._id.toHexString()) } } },
      { $group: { _id: "$clipId", count: { $sum: 1 } } },
    ]),
  ]);
  const byId = new Map(challenges.map((c) => [c._id.toHexString(), c]));
  const voteCounts = new Map(votes.map((v) => [v._id, v.count]));

  return clips.map((clip) => {
    const id = clip._id.toHexString();
    const challenge = clip.challengeId ? byId.get(clip.challengeId) : undefined;
    return {
      id,
      title: clip.title,
      status: clip.status,
      rejectionReason: clip.moderation?.rejectionReason ?? null,
      thumbnailUrl: `/api/clips/${id}/media/thumbnail`,
      voteCount: voteCounts.get(id) ?? 0,
      createdAt: new Date(clip.createdAt).toISOString(),
      challenge: challenge
        ? {
            id: challenge._id.toHexString(),
            slug: challenge.slug,
            title: sponsoredTitle({ title: challenge.title, sponsorName: challenge.sponsorName ?? null }),
            open: isChallengeLinkable(challenge, now),
          }
        : null,
    };
  });
}
