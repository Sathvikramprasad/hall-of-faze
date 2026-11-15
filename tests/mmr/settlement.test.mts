import assert from "node:assert/strict";
import { after, test } from "node:test";
import mongoose, { Types } from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

// Isolated replica set: never reads .env.local or connects to a deployed DB.
const repl = await MongoMemoryReplSet.create({ binary: { version: "7.0.14" }, replSet: { count: 1 } });
process.env.MONGODB_URI = repl.getUri();
const { connectDB } = await import("../../src/lib/mongodb");
const { settleChallengeMmr, getPlayerMmr } = await import("../../src/lib/mmr-server");
const { castVote } = await import("../../src/lib/community-data");
const { default: Challenge } = await import("../../src/models/Challenge");
const { default: Result } = await import("../../src/models/MmrResult");
const { default: Settlement } = await import("../../src/models/MmrSettlement");
const { default: Vote } = await import("../../src/models/Vote");
await connectDB();
await Promise.all([Challenge.init(), Result.init(), Settlement.init(), Vote.init()]);
after(async () => { await mongoose.disconnect(); await repl.stop(); });
const end = new Date("2026-11-10T00:00:00Z");
const start = new Date("2026-11-01T00:00:00Z");
async function challenge(extra = {}) {
  return Challenge.create({ slug: new Types.ObjectId().toHexString(), title: "Test challenge", description: "Test",
    eligibilitySummary: "All players", status: "active", roundKey: "2026-11", startsAt: start, endsAt: end,
    sponsorName: "Test sponsor", championBadgeUrl: "https://example.com/champion.png", ...extra });
}
async function entrants(challengeId: string, count: number) {
  const rows = Array.from({ length: count }, (_, i) => ({
    _id: new Types.ObjectId(), challengeId, uploaderId: new Types.ObjectId().toHexString(),
    title: `Clip ${i}`, status: "approved", approvedAt: new Date(start.getTime() + 1000 + i),
  }));
  if (rows.length) await mongoose.connection.collection("clips").insertMany(rows);
  return rows;
}

test("all players beyond 5000 clips settle once under simultaneous requests; deadlines and best clip are respected", async () => {
  const c = await challenge();
  const id = c.id;
  const clips = await entrants(id, 5011);
  await mongoose.connection.collection("clips").insertMany([
    { ...clips[0], _id: new Types.ObjectId(), approvedAt: new Date(start.getTime() + 2000) },
    { ...clips[0], _id: new Types.ObjectId(), uploaderId: new Types.ObjectId().toHexString(), approvedAt: end },
    { ...clips[0], _id: new Types.ObjectId(), uploaderId: new Types.ObjectId().toHexString(), status: "rejected" },
  ]);
  await Vote.create([
    { voterId: new Types.ObjectId().toHexString(), clipId: clips[1]._id.toHexString(), challengeId: id, votingRound: c.roundKey, createdAt: new Date(start.getTime() + 2000) },
    { voterId: new Types.ObjectId().toHexString(), clipId: clips[0]._id.toHexString(), challengeId: id, votingRound: c.roundKey, createdAt: end },
    { voterId: new Types.ObjectId().toHexString(), clipId: clips[0]._id.toHexString(), challengeId: id, votingRound: "2026-10", createdAt: start },
  ]);
  const responses = await Promise.all(Array.from({ length: 4 }, () => settleChallengeMmr(id, end)));
  assert.equal(responses.filter(r => !r!.alreadySettled).length, 1);
  assert.ok(responses.every(r => r!.settled === clips.length));
  assert.equal(await Result.countDocuments({ challengeId: id }), clips.length);
  assert.equal(await Settlement.countDocuments({ challengeId: id }), 1);
  const winner = await Result.findOne({ challengeId: id, place: 1 }).lean();
  assert.equal(winner!.userId, clips[1].uploaderId);
  assert.equal(winner!.votes, 1);
  assert.equal((await Result.findOne({ challengeId: id, userId: clips[0].uploaderId }).lean())!.votes, 0);
  const profile = await getPlayerMmr(clips[1].uploaderId, end);
  assert.equal(profile.rating.tier, 4);
  assert.equal(profile.wins, 1);
  assert.equal(profile.badges[0].artworkUrl, c.championBadgeUrl);
  assert.equal(profile.badges[0].sponsor, "Test sponsor");
  const last = await Result.findOne({ challengeId: id, place: clips.length }).lean();
  assert.ok(last!.delta < 0);
});

test("empty rounds have a durable idempotent settlement marker", async () => {
  const c = await challenge();
  assert.equal((await settleChallengeMmr(c.id, end))!.settled, 0);
  assert.equal((await settleChallengeMmr(c.id, end))!.alreadySettled, true);
});

test("transaction rollback leaves no partial ratings or marker, and retry succeeds", async () => {
  const c = await challenge();
  await entrants(c.id, 3);
  const original = Settlement.create;
  try {
    Settlement.create = (() => { throw new Error("Injected failure after results"); }) as typeof Settlement.create;
    await assert.rejects(settleChallengeMmr(c.id, end), /Injected failure/);
  } finally { Settlement.create = original; }
  assert.equal(await Result.countDocuments({ challengeId: c.id }), 0);
  assert.equal(await Settlement.countDocuments({ challengeId: c.id }), 0);
  assert.equal((await settleChallengeMmr(c.id, end))!.settled, 3);
});

test("draft/open rounds, invalid IDs and legacy partial batches fail without mutation", async () => {
  const draft = await challenge({ status: "draft" });
  const open = await challenge({ endsAt: new Date("2099-01-01") });
  await assert.rejects(settleChallengeMmr(draft.id, end), /Draft/);
  await assert.rejects(settleChallengeMmr(open.id, end), /still open/);
  await assert.rejects(settleChallengeMmr("no", end), /Invalid/);
  const legacy = await challenge();
  await Result.create({ challengeId: legacy.id, roundKey: legacy.roundKey, userId: new Types.ObjectId().toHexString(), place: 1, participants: 1, votes: 0, topVotes: 0, delta: 300, awardedAt: end, challengeTitle: "Legacy" });
  await assert.rejects(settleChallengeMmr(legacy.id, end), /reconciliation/);
  assert.equal(await Result.countDocuments({ challengeId: legacy.id }), 1);
  assert.equal(await Settlement.countDocuments({ challengeId: legacy.id }), 0);
});

test("vote fence preserves duplicate guard and rejects closed challenges", async () => {
  const now = new Date();
  const c = await challenge({ startsAt: new Date(now.getTime() - 10000), endsAt: new Date(now.getTime() + 60000) });
  const [clip] = await entrants(c.id, 1);
  const input = { voterId: new Types.ObjectId().toHexString(), clipId: clip._id.toHexString(), challengeId: c.id };
  const outcomes = await Promise.allSettled([castVote(input), castVote(input)]);
  assert.equal(outcomes.filter(o => o.status === "fulfilled").length, 1);
  assert.equal(await Vote.countDocuments({ challengeId: c.id }), 1);
  await Challenge.updateOne({ _id: c._id }, { $set: { endsAt: now } });
  await assert.rejects(castVote({ ...input, voterId: new Types.ObjectId().toHexString() }), /not accepting votes/);
});

test("public APIs expose complete paginated standings and ranks without private account data", async () => {
  const { NextRequest } = await import("next/server");
  const { default: User } = await import("../../src/models/User");
  const { GET: standings } = await import("../../src/app/api/challenges/[id]/standings/route");
  const { GET: profile } = await import("../../src/app/api/users/[id]/mmr/route");
  const c = await challenge();
  const clips = await entrants(c.id, 53);
  await User.create({ _id: clips[0].uploaderId, email: "private@example.com", passwordHash: "private", displayName: "Champion" });
  await settleChallengeMmr(c.id.toUpperCase(), end);
  assert.equal((await settleChallengeMmr(c.id, end))!.alreadySettled, true);
  const response = await standings(new NextRequest(`http://localhost/api/challenges/${c.id}/standings?page=2`), { params: Promise.resolve({ id: c.id }) });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.data.total, 53);
  assert.equal(body.data.entries.length, 3);
  assert.equal(body.data.entries[0].place, 51);
  assert.equal(body.data.entries[2].place, 53);
  const publicProfile = await profile(new Request("http://localhost"), { params: Promise.resolve({ id: clips[0].uploaderId.toUpperCase() }) });
  const publicBody = await publicProfile.json();
  assert.equal(publicBody.data.displayName, "Champion");
  assert.equal(publicBody.data.wins, 1);
  assert.ok(!JSON.stringify(publicBody).includes("private"));
  const missing = await profile(new Request("http://localhost"), { params: Promise.resolve({ id: new Types.ObjectId().toHexString() }) });
  assert.equal(missing.status, 404);
});

test("moderator APIs enforce role/origin, validate artwork, freeze badges and replay settlement", async () => {
  const { NextRequest, NextResponse } = await import("next/server");
  const { startSession } = await import("../../src/lib/auth");
  const { default: User } = await import("../../src/models/User");
  const { POST: settle } = await import("../../src/app/api/admin/mmr/settle/route");
  const { PATCH: badge } = await import("../../src/app/api/admin/mmr/badge/route");
  const moderator = await User.create({ email: "mod@example.com", passwordHash: "private", displayName: "Moderator", role: "moderator" });
  const account = await User.create({ email: "fan@example.com", passwordHash: "private", displayName: "Fan" });
  async function cookie(user: typeof moderator) {
    const response = new NextResponse();
    await startSession(response, user._id);
    return response.cookies.getAll().map(c => `${c.name}=${c.value}`).join("; ");
  }
  const modCookie = await cookie(moderator);
  const fanCookie = await cookie(account);
  const c = await challenge();
  const request = (payload: object, cookie = modCookie, origin = "http://localhost") => new NextRequest("http://localhost/api/admin/mmr/settle", { method: "POST", headers: { "Content-Type": "application/json", origin, cookie }, body: JSON.stringify(payload) });
  assert.equal((await settle(request({ challengeId: c.id }, ""))).status, 403);
  assert.equal((await settle(request({ challengeId: c.id }, fanCookie))).status, 403);
  assert.equal((await settle(request({ challengeId: c.id }, modCookie, "https://evil.example"))).status, 403);
  assert.equal((await settle(request({ challengeId: "invalid" }))).status, 400);
  assert.equal((await badge(request({ challengeId: c.id, artworkUrl: "javascript:alert(1)" }))).status, 400);
  assert.equal((await badge(request({ challengeId: c.id, artworkUrl: "https://user:secret@example.com/x.png" }))).status, 400);
  assert.equal((await badge(request({ challengeId: c.id, artworkUrl: "https://example.com/new.png" }))).status, 200);
  const [clip] = await entrants(c.id, 1);
  assert.equal((await settle(request({ challengeId: c.id }))).status, 200);
  const again = await settle(request({ challengeId: c.id }));
  assert.equal((await again.json()).data.alreadySettled, true);
  assert.equal((await badge(request({ challengeId: c.id, artworkUrl: "https://example.com/changed.png" }))).status, 409);
  assert.equal((await getPlayerMmr(clip.uploaderId, end)).badges[0].artworkUrl, "https://example.com/new.png");
});

test("legacy partial rows do not affect public ranks", async () => {
  const userId = new Types.ObjectId().toHexString();
  await Result.create({ challengeId: new Types.ObjectId().toHexString(), roundKey: "2026-11", userId, place: 1, participants: 1, votes: 0, topVotes: 0, delta: 300, awardedAt: end, challengeTitle: "Incomplete" });
  const profile = await getPlayerMmr(userId, end);
  assert.equal(profile.rating.tier, 5);
  assert.equal(profile.wins, 0);
  assert.equal(profile.challengesPlayed, 0);
});
