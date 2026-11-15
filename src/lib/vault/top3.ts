import { Types } from "mongoose";
import { getChallengeLeaderboard, listActiveChallenges } from "@/lib/community-data";
import UserModel from "@/models/User";
import type { MonthlyTop3Entry } from "./types";

export type MonthlyTop3 = {
  monthLabel: string;
  entries: MonthlyTop3Entry[];
};

function monthLabel(roundKey?: string): string {
  const date = roundKey && /^\d{4}-\d{2}$/.test(roundKey)
    ? new Date(`${roundKey}-01T00:00:00.000Z`)
    : new Date();
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export async function getMonthlyTop3(): Promise<MonthlyTop3> {
  try {
    const [challenge] = await listActiveChallenges();
    if (!challenge) return { monthLabel: monthLabel(), entries: [] };

    const leaderboard = await getChallengeLeaderboard(challenge.id, challenge.roundKey, 3);
    const userIds = leaderboard
      .map((entry) => entry.uploaderId)
      .filter((id) => Types.ObjectId.isValid(id));
    const users = await UserModel.find({ _id: { $in: userIds } })
      .select({ displayName: 1 })
      .lean<Array<{ _id: Types.ObjectId; displayName: string }>>()
      .exec();
    const names = new Map(users.map((user) => [user._id.toHexString(), user.displayName]));

    return {
      monthLabel: monthLabel(challenge.roundKey),
      entries: leaderboard.map((entry, index) => ({
        rank: (index + 1) as 1 | 2 | 3,
        title: entry.title,
        creator: names.get(entry.uploaderId) ?? "Community member",
        category: challenge.displayTitle,
        votes: entry.voteCount,
        href: `/clips/${entry.clipId}`,
      })),
    };
  } catch (error) {
    console.error("Monthly Top 3 lookup failed:", error);
    return { monthLabel: monthLabel(), entries: [] };
  }
}
