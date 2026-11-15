import type { NextRequest } from "next/server";
import { fail, hasValidOrigin, ok, parseObject } from "@/lib/api";
import { getCurrentUser, serializeUser } from "@/lib/auth";
import { CHECK_MESSAGES, consumeCode } from "@/lib/account-codes";
import { normalizeCode } from "@/lib/email-code-rules";

/** POST { code } — confirms the signed-in account's email with the 6-digit code. */
export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid request origin.");
  const body = await parseObject(request);
  const code = normalizeCode(body?.code);
  if (!code) return fail(400, "INVALID_INPUT", "Enter the 6-digit code from the email.");
  try {
    const user = await getCurrentUser(request, { allowUnverified: true });
    if (!user) return fail(401, "UNAUTHENTICATED", "Sign in to continue.");
    if (user.emailVerified !== false) return ok({ user: serializeUser(user) });
    const result = await consumeCode(user._id, "verify_email", code);
    if (result !== "ok") return fail(400, "INVALID_INPUT", CHECK_MESSAGES[result]);
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();
    return ok({ user: serializeUser(user) });
  } catch (error) {
    console.error("Email verification failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to verify right now.");
  }
}
