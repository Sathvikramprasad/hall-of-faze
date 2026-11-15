import assert from "node:assert/strict";
import test from "node:test";

const rulesModuleUrl = new URL("../../src/lib/community-rules.ts", import.meta.url).href;
const {
  getUtcVotingRound,
  isChallengeOpen,
  isVotingRoundKey,
  rankLeaderboardEntries,
} = await import(rulesModuleUrl);

test("UTC voting rounds use YYYY-MM", () => {
  assert.equal(getUtcVotingRound(new Date("2026-01-31T23:59:59Z")), "2026-01");
  assert.equal(getUtcVotingRound(new Date("2026-11-01T00:00:00Z")), "2026-11");
  assert.equal(isVotingRoundKey("2026-11"), true);
  assert.equal(isVotingRoundKey("2026-13"), false);
  assert.equal(isVotingRoundKey("November-2026"), false);
});

test("challenge windows include the opening instant and exclude the closing instant", () => {
  const challenge = {
    status: "active" as const,
    startsAt: "2026-11-01T00:00:00Z",
    endsAt: "2026-12-01T00:00:00Z",
  };
  assert.equal(isChallengeOpen(challenge, new Date("2026-11-01T00:00:00Z")), true);
  assert.equal(isChallengeOpen(challenge, new Date("2026-11-30T23:59:59Z")), true);
  assert.equal(isChallengeOpen(challenge, new Date("2026-12-01T00:00:00Z")), false);
  assert.equal(isChallengeOpen({ ...challenge, status: "closed" }, new Date("2026-11-15T00:00:00Z")), false);
});

test("leaderboard ordering is deterministic across vote and approval ties", () => {
  const input = [
    { clipId: "c", voteCount: 8, approvedAt: "2026-11-10T12:00:00Z" },
    { clipId: "b", voteCount: 10, approvedAt: "2026-11-11T12:00:00Z" },
    { clipId: "a", voteCount: 10, approvedAt: "2026-11-11T12:00:00Z" },
    { clipId: "d", voteCount: 10, approvedAt: "2026-11-09T12:00:00Z" },
  ];
  const ranked = rankLeaderboardEntries(input);
  assert.deepEqual(ranked.map(({ clipId, rank }: { clipId: string; rank: number }) => ({ clipId, rank })), [
    { clipId: "d", rank: 1 },
    { clipId: "a", rank: 2 },
    { clipId: "b", rank: 3 },
    { clipId: "c", rank: 4 },
  ]);
  assert.equal(input[0].clipId, "c", "ranking must not mutate the caller's array");
});
