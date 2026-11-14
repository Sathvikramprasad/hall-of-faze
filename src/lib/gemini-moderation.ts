/**
 * Gemini structured moderation (advisory).
 *
 * Sends the clip's title/description, custom thumbnail and — when small enough —
 * the video itself to Gemini with a JSON schema, then stores the structured
 * recommendation on the clip for the human moderator. It NEVER approves or
 * rejects a clip by itself: manual moderation stays the source of truth.
 *
 * Env: GEMINI_API_KEY (required), GEMINI_MODEL (default below),
 *      GEMINI_AUTO_REVIEW=true to run automatically after each verified upload.
 *
 * Server-only module.
 */
import { connectDB } from "@/lib/mongodb";
import Clip, { type AiModerationResult, type ClipDocument } from "@/models/Clip";
import { readObject } from "@/lib/storage";
import { THUMBNAIL_MAX_BYTES } from "@/lib/clip-rules";

const DEFAULT_MODEL = "gemini-3.5-flash";
/** Inline request data is limited (~20 MB per request incl. base64 overhead). */
const INLINE_VIDEO_MAX_BYTES = 12 * 1024 * 1024;

export const AI_CATEGORIES = [
  "none",
  "violence_gore",
  "sexual",
  "hate",
  "harassment",
  "self_harm",
  "dangerous_acts",
  "personal_info",
  "spam_or_scam",
  "copyright",
  "off_topic",
] as const;

export class AiModerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiModerationError";
  }
}

export function isAiModerationConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function isAutoAiReviewEnabled(): boolean {
  return isAiModerationConfigured() && process.env.GEMINI_AUTO_REVIEW === "true";
}

const responseSchema = {
  type: "object",
  properties: {
    verdict: {
      type: "string",
      enum: ["approve", "review", "reject"],
      description:
        "approve = clearly fine for a public gaming community; review = unsure, a human should look closely; reject = clearly violates the rules.",
    },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    categories: {
      type: "array",
      items: { type: "string", enum: [...AI_CATEGORIES] },
      description: 'Rule categories that apply. Use ["none"] when nothing applies.',
    },
    summary: {
      type: "string",
      description: "One or two sentences for the human moderator explaining the verdict.",
    },
  },
  required: ["verdict", "confidence", "categories", "summary"],
  propertyOrdering: ["verdict", "confidence", "categories", "summary"],
};

function prompt(clip: ClipDocument, inputs: string[]): string {
  return [
    "You are a content moderator for Hall of FaZe, a public fan site where people submit short gaming clips for community challenges.",
    "Assess whether this submission is safe to publish. Flag: graphic real-world violence or gore, sexual content, hate or harassment,",
    "self-harm, dangerous real-world acts, doxxing or personal information, spam/scams, obvious copyright re-uploads, and content unrelated to gaming.",
    "In-game violence in ordinary video games is normal and acceptable.",
    `Inputs provided: ${inputs.join(", ")}.`,
    "",
    `Title: ${clip.title}`,
    `Description: ${clip.description || "(none)"}`,
  ].join("\n");
}

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
};

function parseResult(raw: unknown, model: string, inputs: string[]): AiModerationResult {
  if (!raw || typeof raw !== "object") throw new AiModerationError("Gemini returned an empty result.");
  const r = raw as Record<string, unknown>;
  const verdict = r.verdict;
  if (verdict !== "approve" && verdict !== "review" && verdict !== "reject") {
    throw new AiModerationError("Gemini returned an invalid verdict.");
  }
  const confidence = typeof r.confidence === "number" ? Math.min(1, Math.max(0, r.confidence)) : 0;
  const categories = Array.isArray(r.categories)
    ? r.categories.filter((c): c is string => typeof c === "string" && (AI_CATEGORIES as readonly string[]).includes(c))
    : [];
  const summary = typeof r.summary === "string" ? r.summary.slice(0, 1000) : "";
  return { verdict, confidence, categories, summary, model, inputs, ranAt: new Date() };
}

async function callGemini(clip: ClipDocument): Promise<AiModerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AiModerationError("GEMINI_API_KEY is not set.");
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const inputs = ["text", "thumbnail"];
  const parts: Record<string, unknown>[] = [];

  const thumb = await readObject(clip.thumbnail.key, THUMBNAIL_MAX_BYTES);
  parts.push({ inlineData: { mimeType: clip.thumbnail.contentType, data: Buffer.from(thumb).toString("base64") } });

  if (clip.video.size <= INLINE_VIDEO_MAX_BYTES) {
    const video = await readObject(clip.video.key, INLINE_VIDEO_MAX_BYTES);
    parts.push({ inlineData: { mimeType: clip.video.contentType, data: Buffer.from(video).toString("base64") } });
    inputs.push("video");
  }
  parts.push({ text: prompt(clip, inputs) });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseJsonSchema: responseSchema,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    },
  );

  const data = (await res.json().catch(() => ({}))) as GeminiResponse;
  if (!res.ok) {
    throw new AiModerationError(`Gemini request failed (${res.status}): ${data.error?.message ?? "unknown error"}`);
  }
  if (data.promptFeedback?.blockReason) {
    // Gemini's own safety filter refused the input — that is itself a strong signal.
    return {
      verdict: "reject",
      confidence: 0.9,
      categories: [],
      summary: `Gemini blocked this input (${data.promptFeedback.blockReason}). Review it carefully.`,
      model,
      inputs,
      ranAt: new Date(),
    };
  }
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AiModerationError("Gemini did not return valid JSON.");
  }
  return parseResult(parsed, model, inputs);
}

/** Runs AI moderation for a clip and stores the result (or the error). */
export async function runAiModeration(clipId: string): Promise<ClipDocument | null> {
  await connectDB();
  const clip = await Clip.findById(clipId).lean<ClipDocument>().exec();
  if (!clip) return null;
  if (clip.status === "processing") throw new AiModerationError("The upload has not been verified yet.");

  try {
    const result = await callGemini(clip);
    return await Clip.findByIdAndUpdate(
      clip._id,
      { $set: { aiModeration: result, aiModerationError: null } },
      { returnDocument: "after" },
    )
      .lean<ClipDocument>()
      .exec();
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI moderation failed.";
    await Clip.updateOne({ _id: clip._id }, { $set: { aiModerationError: message.slice(0, 500) } }).exec();
    throw error instanceof AiModerationError ? error : new AiModerationError(message);
  }
}
