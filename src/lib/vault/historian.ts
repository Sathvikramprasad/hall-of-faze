import { getMembers, getVaultEntries, findRelatedEntries, formatEntryDate } from "./queries";
import type { VaultEntry } from "./types";

// Gemini Historian: answers questions using ONLY the curated, sourced Vault data.
// Server-side only (reads GEMINI_API_KEY). Called from /api/vault/historian.
//
// Env:
//   GEMINI_API_KEY  optional; without it we return a deterministic sourced answer
//   GEMINI_MODEL    optional. One model id, or a comma-separated list tried in
//                   order, e.g. "gemini-3.7-flash,gemini-3.5-flash".
//                   Defaults to DEFAULT_MODELS below.

/** Tried in order. If one is overloaded (429/503), slow, or missing, we move on. */
const DEFAULT_MODELS = ["gemini-3.7-flash", "gemini-3.5-flash"];
/** Per model. Overloaded models can take ~15s just to return a 503, so fail fast. */
const ATTEMPT_TIMEOUT_MS = 12_000;
/** Statuses where trying the next model makes sense. */
const TRY_NEXT_MODEL = new Set([404, 429, 500, 502, 503, 504]);

export const QUESTION_MIN = 3;
export const QUESTION_MAX = 500;

export type RelatedEntry = Pick<VaultEntry, "id" | "title" | "date" | "summary" | "sources">;

export type HistorianResponse =
  | {
      status: "answered";
      answer: string;
      /** Vault entry ids the answer is based on. */
      citations: RelatedEntry[];
    }
  | {
      /** The question is fine, but the Historian can't answer it right now. */
      status: "unavailable";
      reason: "not_configured" | "busy" | "timeout" | "upstream_error" | "rate_limited";
      message: string;
      related: RelatedEntry[];
    }
  | {
      /** The question can't be answered from the Vault, or is invalid. */
      status: "unsupported";
      reason: "outside_vault" | "invalid_question";
      message: string;
      related: RelatedEntry[];
    };

function toRelated(entries: VaultEntry[]): RelatedEntry[] {
  return entries.map(({ id, title, date, summary, sources }) => ({
    id,
    title,
    date,
    summary,
    sources,
  }));
}

export function validateQuestion(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const question = input.trim();
  if (question.length < QUESTION_MIN || question.length > QUESTION_MAX) return null;
  return question;
}

/** The curated Vault, including attribution links, serialized as Gemini's only context. */
export function buildVaultContext(): string {
  const entries = getVaultEntries()
    .map(
      (e) =>
        `[${e.id}] ${formatEntryDate(e)}: ${e.title}. ${e.summary}` +
        (e.memberSlugs?.length ? ` (members: ${e.memberSlugs.join(", ")})` : "") +
        ` Sources: ${e.sources.map((source) => `${source.label} (${source.url})`).join("; ")}`,
    )
    .join("\n");
  const members = getMembers()
    .map(
      (m) =>
        `[member:${m.slug}] ${m.handle}${m.realName ? ` (${m.realName})` : ""}, ${m.role}. ${m.bio}`,
    )
    .join("\n");
  return `VAULT ENTRIES\n${entries}\n\nMEMBER PROFILES\n${members}`;
}

const SYSTEM_INSTRUCTION = `You are the Hall of FaZe Historian.
Answer questions about FaZe Clan history using ONLY the Vault context provided.
Rules:
- If the context does not contain the answer, set "answerable" to false and leave "answer" empty. Do not use outside knowledge, and do not guess.
- Keep answers to 2–4 sentences, in plain language.
- In "citedIds", list the ids of the Vault entries (the text inside [brackets], without "member:") that support the answer.
- The application will display each cited entry's reference links, so cite every entry used.`;

type GeminiJson = {
  answerable?: boolean;
  answer?: string;
  citedIds?: string[];
};

type Failure = "busy" | "timeout" | "error";

type Attempt =
  | { ok: true; data: unknown }
  | { ok: false; failure: Failure; tryNext: boolean };

function getModels(): string[] {
  const fromEnv = (process.env.GEMINI_MODEL ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : DEFAULT_MODELS;
}

async function callGemini(model: string, apiKey: string, question: string): Promise<Attempt> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [
          {
            role: "user",
            parts: [{ text: `${buildVaultContext()}\n\nQUESTION\n${question}` }],
          },
        ],
        generationConfig: {
          // Gemini 3 models "think" before answering; low keeps latency down.
          // thinkingLevel only exists on Gemini 3+; older models reject it.
          ...(model.startsWith("gemini-3")
            ? { thinkingConfig: { thinkingLevel: "low" } }
            : {}),
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              answerable: { type: "BOOLEAN" },
              answer: { type: "STRING" },
              citedIds: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["answerable", "answer", "citedIds"],
          },
        },
      }),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      console.error(`Gemini ${model} failed: HTTP ${res.status} ${detail}`);
      return {
        ok: false,
        failure: res.status === 429 || res.status === 503 ? "busy" : "error",
        tryNext: TRY_NEXT_MODEL.has(res.status),
      };
    }
    return { ok: true, data: await res.json() };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error(
      `Gemini ${model} ${timedOut ? `timed out after ${ATTEMPT_TIMEOUT_MS / 1000}s` : "request error:"}`,
      timedOut ? "" : error,
    );
    return { ok: false, failure: timedOut ? "timeout" : "error", tryNext: true };
  }
}

const FAILURE_RESPONSES: Record<Failure, { reason: "busy" | "timeout" | "upstream_error"; message: string }> = {
  busy: {
    reason: "busy",
    message: "Gemini is overloaded right now, so the Historian is offline. Here are Vault entries that may help.",
  },
  timeout: {
    reason: "timeout",
    message: "The Historian took too long to answer. Here are Vault entries that may help.",
  },
  error: {
    reason: "upstream_error",
    message: "The Historian couldn't reach Gemini. Here are Vault entries that may help.",
  },
};

/**
 * Keeps the Historian useful when Gemini is missing or temporarily unavailable.
 * The related-entry search already ranks the best sourced Vault match first, so
 * returning that entry's dated summary is deterministic and cannot invent facts.
 */
function sourceBackedFallback(entries: VaultEntry[]): HistorianResponse | null {
  const bestMatch = entries[0];
  if (!bestMatch) return null;

  return {
    status: "answered",
    answer: `${formatEntryDate(bestMatch)}: ${bestMatch.summary}`,
    citations: toRelated([bestMatch]),
  };
}

export async function askHistorian(question: string): Promise<HistorianResponse> {
  const relatedEntries = findRelatedEntries(question);
  const related = toRelated(relatedEntries);
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return sourceBackedFallback(relatedEntries) ?? {
      status: "unsupported",
      reason: "outside_vault",
      message: "That isn't covered in the sourced Vault yet, so the Historian won't guess.",
      related,
    };
  }

  let data: unknown;
  let lastFailure: Failure = "error";
  for (const model of getModels()) {
    const attempt = await callGemini(model, apiKey, question);
    if (attempt.ok) {
      data = attempt.data;
      break;
    }
    lastFailure = attempt.failure;
    if (!attempt.tryNext) break;
  }

  if (data === undefined) {
    return sourceBackedFallback(relatedEntries) ?? {
      status: "unavailable",
      ...FAILURE_RESPONSES[lastFailure],
      related,
    };
  }

  const parsed = parseGeminiJson(data);
  if (!parsed) {
    return sourceBackedFallback(relatedEntries) ?? {
      status: "unavailable",
      ...FAILURE_RESPONSES.error,
      related,
    };
  }

  if (!parsed.answerable || !parsed.answer?.trim()) {
    return {
      status: "unsupported",
      reason: "outside_vault",
      message: "That isn't covered in the Vault yet, so the Historian won't guess.",
      related,
    };
  }

  // Only keep ids that exist in the Vault, in timeline order.
  const cited = new Set(parsed.citedIds ?? []);
  const citations = toRelated(getVaultEntries().filter((e) => cited.has(e.id)));

  return { status: "answered", answer: parsed.answer.trim(), citations };
}

function parseGeminiJson(data: unknown): GeminiJson | null {
  try {
    const text = (
      data as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    )?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("");
    if (!text) return null;
    const json = JSON.parse(text) as GeminiJson;
    return typeof json === "object" && json !== null ? json : null;
  } catch {
    return null;
  }
}
