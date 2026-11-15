import { NextResponse, type NextRequest } from "next/server";
import { hasValidOrigin } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
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
//   200 { status: "unsupported", reason: "outside_faze_scope", ... }
//   200 { status: "unavailable", reason: "not_configured" | "upstream_error" | "timeout", ... }
//   401 { status: "unauthenticated", ... }
//   400 { status: "unsupported", reason: "invalid_question", ... }
// The UI treats every status as a normal result, so the page never breaks
// when Gemini is missing or down.

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return NextResponse.json(
      { status: "unsupported", reason: "invalid_question", message: "Invalid request origin.", related: [] } satisfies HistorianResponse,
      { status: 403 },
    );
  }

  let user;
  try {
    user = await getCurrentUser(request);
  } catch (error) {
    console.error("Historian session lookup failed:", error);
    return NextResponse.json(
      {
        status: "unavailable",
        reason: "upstream_error",
        message: "The Historian is temporarily unavailable.",
        related: [],
      } satisfies HistorianResponse,
      { status: 503 },
    );
  }
  if (!user) {
    return NextResponse.json(
      {
        status: "unauthenticated",
        message: "Sign in to ask the Historian.",
      } satisfies HistorianResponse,
      { status: 401 },
    );
  }

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

  try {
    const rateLimit = await consumeRateLimit({
      scope: "vault-historian",
      identifier: user._id.toHexString(),
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        {
          status: "unavailable",
          reason: "rate_limited",
          message: "Too many questions right now. Please try again later.",
          related: [],
        } satisfies HistorianResponse,
        { status: 429 },
      );
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return response;
    }
  } catch (error) {
    console.error("Historian rate limit failed:", error);
    return NextResponse.json(
      {
        status: "unavailable",
        reason: "upstream_error",
        message: "The Historian is temporarily unavailable.",
        related: [],
      } satisfies HistorianResponse,
      { status: 503 },
    );
  }

  const result = await askHistorian(question);
  return NextResponse.json(result);
}
