import test from "node:test";
import assert from "node:assert/strict";
import { applyDelta, decayRating, NEW_RATING, placementDelta, TIER_SPAN } from "../../src/lib/mmr-rules.ts";

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
