import { NextResponse } from "next/server";
import {
  askHistorian,
  validateQuestion,
  QUESTION_MAX,
  QUESTION_MIN,
  type HistorianResponse,
} from "@/lib/vault/historian";

// POST /api/vault/historian  { "question": "When was FaZe founded?" }
//
// Always responds with a HistorianResponse. Fallbacks are explicit:
//   200 { status: "answered", ... }
//   200 { status: "unsupported", reason: "outside_vault", ... }
//   200 { status: "unavailable", reason: "not_configured" | "upstream_error" | "timeout", ... }
//   400 { status: "unsupported", reason: "invalid_question", ... }
// The UI treats every status as a normal result, so the page never breaks
// when Gemini is missing or down.

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const question = validateQuestion((body as { question?: unknown } | null)?.question);
  if (!question) {
    const invalid: HistorianResponse = {
      status: "unsupported",
      reason: "invalid_question",
      message: `Ask a question between ${QUESTION_MIN} and ${QUESTION_MAX} characters.`,
      related: [],
    };
    return NextResponse.json(invalid, { status: 400 });
  }

  const result = await askHistorian(question);
  return NextResponse.json(result);
}
