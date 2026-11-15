import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getRemixMissionForChallenge, type RemixMission } from "@/lib/remix";
import Challenge from "@/models/Challenge";

/** Resolve a persisted challenge to its reusable Remix the Vault mission. */
export async function getRemixMissionForChallengeId(
  challengeId: string | null | undefined,
): Promise<RemixMission | null> {
  if (!challengeId || !Types.ObjectId.isValid(challengeId)) return null;
  await connectDB();
  const challenge = await Challenge.findById(challengeId)
    .select({ slug: 1 })
    .lean<{ slug: string }>()
    .exec();
  return challenge ? getRemixMissionForChallenge(challenge.slug) : null;
}
