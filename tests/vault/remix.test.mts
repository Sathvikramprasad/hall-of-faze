import assert from "node:assert/strict";
import test from "node:test";
const remixModuleUrl = new URL("../../src/lib/remix.ts", import.meta.url).href;
const {
  calculateFazeDnaOverall,
  getRemixMissionForChallenge,
  getRemixMissionForVaultEntry,
  qualifiesForAiAutoApproval,
} = (await import(remixModuleUrl)) as typeof import("../../src/lib/remix");

test("maps the 2012 Vault moment to the existing Legacy Challenge", () => {
  const fromVault = getRemixMissionForVaultEntry("one-million-teamtage");
  const fromChallenge = getRemixMissionForChallenge("legacy-clutch-challenge-2026");
  assert.ok(fromVault);
  assert.equal(fromVault, fromChallenge);
  assert.equal(fromVault.id, "teamtage-2012-remix");
  assert.equal(fromVault.challengeTitle, "Remix the Vault: 2012");
  assert.match(fromVault.rules[1], /10–30 second/);
  assert.deepEqual(fromVault.clipRules, {
    minDurationSeconds: 10,
    maxDurationSeconds: 30,
    maxBytes: 12 * 1024 * 1024,
  });
});

test("calculates FaZe DNA using the mission's fixed weights", () => {
  const mission = getRemixMissionForVaultEntry("one-million-teamtage");
  assert.ok(mission);
  assert.equal(
    calculateFazeDnaOverall(
      { skill: 90, originality: 80, hype: 70, legacyConnection: 60 },
      mission,
    ),
    77,
  );
});

test("auto-approval requires a complete-video, clean, high-confidence result", () => {
  const clean = {
    verdict: "approve" as const,
    confidence: 0.97,
    categories: ["none"],
    inputs: ["text", "thumbnail", "video"],
  };
  assert.equal(qualifiesForAiAutoApproval(clean), true);
  assert.equal(qualifiesForAiAutoApproval({ ...clean, confidence: 0.94 }), false);
  assert.equal(qualifiesForAiAutoApproval({ ...clean, inputs: ["text", "thumbnail"] }), false);
  assert.equal(qualifiesForAiAutoApproval({ ...clean, categories: ["none", "copyright"] }), false);
  assert.equal(qualifiesForAiAutoApproval({ ...clean, verdict: "review" }), false);
});
