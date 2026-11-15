import test from "node:test";
import assert from "node:assert/strict";
const rulesUrl = new URL("../../src/lib/mmr-rules.ts", import.meta.url).href;
const { applyDelta, decayRating, NEW_RATING, placementDelta, TIER_SPAN } = await import(rulesUrl);

test("winner promotes a full tier", () => {
  const delta = placementDelta({place:1,participants:30,votes:50,topVotes:50});
  assert.equal(delta,TIER_SPAN);
  assert.equal(applyDelta(NEW_RATING,delta).tier,4);
});
test("two second places or three thirds promote", () => {
  for (const [place, count] of [[2,2],[3,3]]) {
    let rating = {...NEW_RATING};
    for(let i=0;i<count;i++) rating=applyDelta(rating,placementDelta({place,participants:30,votes:20,topVotes:50}));
    assert.equal(rating.tier,4);
  }
});
test("top ten protection and lower placements penalized", () => {
  assert.ok(placementDelta({place:10,participants:200,votes:0,topVotes:20})>=0);
  assert.ok(placementDelta({place:20,participants:200,votes:0,topVotes:20})>=0);
  assert.ok(placementDelta({place:21,participants:200,votes:0,topVotes:20})<0);
  assert.ok(placementDelta({place:190,participants:200,votes:0,topVotes:20}) < placementDelta({place:100,participants:200,votes:0,topVotes:20}));
});
test("demotion grants one zero-point warning", () => {
  const rank={...NEW_RATING,tier:4 as const,points:10};
  const warned=applyDelta(rank,-20);
  assert.equal(warned.tier,4);
  assert.equal(warned.points,0);
  assert.equal(warned.demotionShield,true);
  assert.equal(applyDelta(warned,-1).tier,5);
});
test("decay starts after inactivity grace", () => {
  const rank={...NEW_RATING,tier:4 as const,points:200,lastActiveAt:"2026-11-01T00:00:00.000Z"};
  assert.equal(decayRating(rank,new Date("2026-11-07T00:00:00.000Z")).points,200);
  assert.ok(decayRating(rank,new Date("2026-11-10T00:00:00.000Z")).points<200);
});

test("winner advances exactly one tier and preserves existing progress", () => {
  for (const tier of [2, 3, 4, 5]) {
    const result = applyDelta({ ...NEW_RATING, tier, points: 275 }, TIER_SPAN);
    assert.equal(result.tier, tier - 1);
    assert.equal(result.points, 275);
  }
  assert.equal(applyDelta({ ...NEW_RATING, tier: 1, points: 275 }, TIER_SPAN).tier, 1);
});

test("fractional top ten percent does not protect the next player", () => {
  assert.ok(placementDelta({ place: 10, participants: 109, votes: 0, topVotes: 0 }) > 0);
  assert.ok(placementDelta({ place: 11, participants: 109, votes: 0, topVotes: 0 }) < 0);
});

test("votes reward protected players and soften losses without preventing a penalty", () => {
  for (const place of [4, 100]) {
    const zero = placementDelta({ place, participants: 100, votes: 0, topVotes: 20 });
    const supported = placementDelta({ place, participants: 100, votes: 20, topVotes: 20 });
    assert.ok(supported > zero);
    if (place === 100) assert.ok(supported < 0);
  }
  for (const votes of [NaN, Infinity, -1, 0.5, 21]) assert.throws(() => placementDelta({ place: 4, participants: 100, votes, topVotes: 20 }));
});

test("positive progress clears the warning; floor and ceiling are bounded", () => {
  const warned = applyDelta({ ...NEW_RATING, tier: 3, points: 1 }, -10);
  const recovered = applyDelta(warned, 1);
  assert.equal(recovered.demotionShield, false);
  assert.equal(applyDelta(recovered, -10).tier, 3);
  assert.equal(applyDelta(NEW_RATING, -1000).points, 0);
  assert.equal(applyDelta({ ...NEW_RATING, tier: 1 }, 10000).points, TIER_SPAN - 1);
  assert.throws(() => applyDelta(NEW_RATING, NaN));
});

test("decay is repeatable, incremental, and eventually reaches the floor", () => {
  const rating = { ...NEW_RATING, tier: 1, points: 200, lastActiveAt: "2026-01-01T00:00:00Z" };
  const first = decayRating(rating, new Date("2026-01-10T00:00:00Z"));
  assert.deepEqual(decayRating(first, new Date("2026-01-10T00:00:00Z")), first);
  assert.deepEqual(decayRating(first, new Date("2026-01-15T00:00:00Z")), decayRating(rating, new Date("2026-01-15T00:00:00Z")));
  const floor = decayRating(rating, new Date("9999-01-01T00:00:00Z"));
  assert.equal(floor.tier, 5);
  assert.equal(floor.points, 0);
});
