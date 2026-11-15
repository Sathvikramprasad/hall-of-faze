/**
 * Pure configuration and scoring rules for Remix the Vault.
 *
 * Add future years by appending another mission. The UI and Gemini pipeline
 * look missions up by Vault entry or challenge slug, so they do not contain
 * 2012-specific branching.
 */

export const FAZE_DNA_SCORE_KEYS = [
  "skill",
  "originality",
  "hype",
  "legacyConnection",
] as const;

export type FazeDnaScoreKey = (typeof FAZE_DNA_SCORE_KEYS)[number];

export type FazeDnaScores = Record<FazeDnaScoreKey, number>;

export type RemixMission = {
  id: string;
  vaultEntryId: string;
  challengeSlug: string;
  eyebrow: string;
  title: string;
  description: string;
  prompt: string;
  clipRules: {
    minDurationSeconds: number;
    maxDurationSeconds: number;
    maxBytes: number;
  };
  submissionGuide: string[];
  rubric: Array<{
    key: FazeDnaScoreKey;
    label: string;
    weight: number;
    description: string;
  }>;
};

export const REMIX_MISSIONS: readonly RemixMission[] = [
  {
    id: "teamtage-2012-remix",
    vaultEntryId: "one-million-teamtage",
    challengeSlug: "legacy-clutch-challenge-2026",
    eyebrow: "Remix the Vault · 2012",
    title: "Bring the 2012 Teamtage energy into 2026",
    description:
      "The one-million-subscriber Teamtage captured the skill, surprise and shared hype that defined early FaZe. Create the next moment in that lineage.",
    prompt:
      "Submit an original 10–30 second gaming clip featuring a clutch, trickshot or high-skill play that could earn a place in a modern FaZe montage.",
    clipRules: {
      minDurationSeconds: 10,
      maxDurationSeconds: 30,
      maxBytes: 12 * 1024 * 1024,
    },
    submissionGuide: [
      "Use gameplay you created or have permission to submit.",
      "Keep the story easy to understand: setup, payoff and reaction.",
      "Use a 10–30 second video no larger than 12 MB so Gemini can inspect the complete clip.",
      "Community votes decide the winner; the FaZe DNA score is coaching and entertainment, not the ranking.",
    ],
    rubric: [
      {
        key: "skill",
        label: "Skill",
        weight: 0.3,
        description: "Execution, difficulty and control shown in the play.",
      },
      {
        key: "originality",
        label: "Originality",
        weight: 0.25,
        description: "A distinctive idea, setup or style rather than a routine clip.",
      },
      {
        key: "hype",
        label: "Hype",
        weight: 0.25,
        description: "Surprise, momentum and replay value for an audience.",
      },
      {
        key: "legacyConnection",
        label: "Legacy connection",
        weight: 0.2,
        description: "How clearly the submission carries forward the Teamtage spirit.",
      },
    ],
  },
] as const;

export function getRemixMissionForVaultEntry(entryId: string): RemixMission | null {
  return REMIX_MISSIONS.find((mission) => mission.vaultEntryId === entryId) ?? null;
}

export function getRemixMission(id: string): RemixMission | null {
  return REMIX_MISSIONS.find((mission) => mission.id === id) ?? null;
}

export function getRemixMissionForChallenge(challengeSlug: string): RemixMission | null {
  return REMIX_MISSIONS.find((mission) => mission.challengeSlug === challengeSlug) ?? null;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** The application calculates the total so Gemini cannot invent its weighting. */
export function calculateFazeDnaOverall(
  scores: FazeDnaScores,
  mission: RemixMission,
): number {
  return Math.round(
    mission.rubric.reduce(
      (total, criterion) => total + clampScore(scores[criterion.key]) * criterion.weight,
      0,
    ),
  );
}

export const AUTO_APPROVE_MIN_CONFIDENCE = 0.95;

export type ModerationCandidate = {
  verdict: "approve" | "review" | "reject";
  confidence: number;
  categories: string[];
  inputs: string[];
};

/**
 * Only a complete-video, high-confidence, clean result may bypass the queue.
 * Every uncertain, failed or flagged result remains available to moderators.
 */
export function qualifiesForAiAutoApproval(result: ModerationCandidate): boolean {
  return (
    result.verdict === "approve" &&
    result.confidence >= AUTO_APPROVE_MIN_CONFIDENCE &&
    result.inputs.includes("video") &&
    result.categories.length === 1 &&
    result.categories[0] === "none"
  );
}
