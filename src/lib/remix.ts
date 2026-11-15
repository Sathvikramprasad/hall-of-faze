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

export const REMIX_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export type FazeDnaScoreKey = (typeof FAZE_DNA_SCORE_KEYS)[number];

export type FazeDnaScores = Record<FazeDnaScoreKey, number>;

export type RemixMission = {
  id: string;
  vaultEntryId: string;
  challengeSlug: string;
  challengeTitle: string;
  eyebrow: string;
  title: string;
  description: string;
  eligibilitySummary: string;
  prompt: string;
  clipRules: {
    minDurationSeconds: number;
    maxDurationSeconds: number;
    maxBytes: number;
  };
  submissionGuide: string[];
  rules: string[];
  howToWin: string[];
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
    challengeTitle: "Remix the Vault: 2012",
    eyebrow: "Remix the Vault · 2012",
    title: "Bring the 2012 Teamtage energy into 2026",
    description:
      "The one-million-subscriber Teamtage captured the skill, surprise and shared hype that defined early FaZe. Create the next moment in that lineage.",
    eligibilitySummary: "Original 10–30 second gaming remixes approved before the voting deadline.",
    prompt:
      "Submit an original 10–30 second gaming clip featuring a clutch, trickshot or high-skill play that could earn a place in a modern FaZe montage.",
    clipRules: {
      minDurationSeconds: 10,
      maxDurationSeconds: 30,
      maxBytes: REMIX_VIDEO_MAX_BYTES,
    },
    submissionGuide: [
      "Use gameplay you created or have permission to submit.",
      "Keep the story easy to understand: setup, payoff and reaction.",
      "Use a 10–30 second video no larger than 50 MB so Gemini can inspect the complete clip.",
      "Community votes decide the winner; the FaZe DNA score is coaching and entertainment, not the ranking.",
    ],
    rules: [
      "Submit footage that you created or have permission to use.",
      "Enter one original 10–30 second gameplay clip no larger than 50 MB (MP4, WebM or MOV), with a custom JPG, PNG or WebP thumbnail under 5 MB.",
      "Clips must come from Counter-Strike 2, VALORANT or Call of Duty.",
      "Gemini checks the complete clip. Only a high-confidence clean result may auto-approve; anything flagged, uncertain or failed goes to a human moderator and is never auto-rejected.",
      "After approval, FaZe DNA provides coaching across skill, originality, hype and legacy connection. This score never affects rank.",
      "One signed-in fan may vote once per clip during this round. Bots, multiple accounts and vote trading are disqualified.",
      "Submissions and votes close at the deadline. Votes cast at or after the closing time do not count.",
      "Voltline Energy is a fictional demo sponsor for this hackathon project. No purchase is necessary and no real prizes are awarded.",
    ],
    howToWin: [
      "Watch the official 2012 one-million-subscriber Teamtage in the Vault mission.",
      "Create an original 10–30 second clutch, trickshot or high-skill play no larger than 50 MB.",
      "Pass Gemini's guarded safety check or human moderation, then unlock your FaZe DNA coaching card.",
      "Share your approved entry and collect valid community votes. FaZe DNA never changes your rank.",
      "Finish in the community-voted Top 3 before the round closes.",
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
