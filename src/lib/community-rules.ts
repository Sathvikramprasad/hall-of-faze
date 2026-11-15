export const CHALLENGE_STATUSES = ["draft", "active", "closed"] as const;
export type ChallengeStatus = (typeof CHALLENGE_STATUSES)[number];

const ROUND_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export type ChallengeWindow = {
  status: ChallengeStatus;
  startsAt: Date | string;
  endsAt: Date | string;
};

export type RankableEntry = {
  clipId: string;
  voteCount: number;
  approvedAt: Date | string;
};

export function isVotingRoundKey(value: string): boolean {
  return ROUND_KEY_PATTERN.test(value);
}

export function getUtcVotingRound(at = new Date()): string {
  if (Number.isNaN(at.getTime())) throw new Error("Cannot create a voting round from an invalid date.");
  return `${at.getUTCFullYear()}-${String(at.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** The closing timestamp is exclusive so a vote at exactly endsAt is late. */
export function isChallengeOpen(challenge: ChallengeWindow, at = new Date()): boolean {
  const startsAt = new Date(challenge.startsAt).getTime();
  const endsAt = new Date(challenge.endsAt).getTime();
  const now = at.getTime();
  return (
    challenge.status === "active" &&
    Number.isFinite(startsAt) &&
    Number.isFinite(endsAt) &&
    startsAt <= now &&
    now < endsAt
  );
}

/**
 * Stable leaderboard ordering:
 * 1. More valid votes.
 * 2. Earlier approval timestamp.
 * 3. Lexicographically smaller clip id.
 *
 * Every item receives a unique ordinal rank. This makes the monthly Top 3
 * deterministic even when two clips have the same vote count.
 */
export function rankLeaderboardEntries<T extends RankableEntry>(entries: readonly T[]): Array<T & { rank: number }> {
  return [...entries]
    .sort((a, b) => {
      if (a.voteCount !== b.voteCount) return b.voteCount - a.voteCount;
      const approvedDifference = new Date(a.approvedAt).getTime() - new Date(b.approvedAt).getTime();
      if (approvedDifference !== 0) return approvedDifference;
      if (a.clipId === b.clipId) return 0;
      return a.clipId < b.clipId ? -1 : 1;
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
