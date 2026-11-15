import type { NextRequest } from "next/server";
import { fail, hasValidOrigin, ok, parseObject } from "@/lib/api";
import { endOtherSessions, getCurrentUser, hashPassword, SESSION_COOKIE } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { CHECK_MESSAGES, consumeCode } from "@/lib/account-codes";
import { normalizeCode, passwordProblem } from "@/lib/email-code-rules";
import UserModel from "@/models/User";

/**
 * POST { code, newPassword }          — signed in
 * POST { email, code, newPassword }   — signed out
 * Sets the new password and signs out every other session.
 */
export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid request origin.");
  const body = await parseObject(request);
  if (!body) return fail(400, "INVALID_INPUT", "Expected a JSON object.");
  const code = normalizeCode(body.code);
  if (!code) return fail(400, "INVALID_INPUT", "Enter the 6-digit code from the email.");
  const problem = passwordProblem(body.newPassword);
  if (problem) return fail(400, "INVALID_INPUT", problem);
  try {
    await connectDB();
    const signedIn = await getCurrentUser(request, { allowUnverified: true });
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const user = signedIn ?? (email ? await UserModel.findOne({ email }) : null);
    if (!user) return fail(400, "INVALID_INPUT", CHECK_MESSAGES.expired);
    const result = await consumeCode(user._id, "reset_password", code);
    if (result !== "ok") return fail(400, "INVALID_INPUT", CHECK_MESSAGES[result]);

    user.passwordHash = await hashPassword(body.newPassword as string);
    // The code arrived by email, so the address is proven.
    if (user.emailVerified === false) {
      user.emailVerified = true;
      user.emailVerifiedAt = new Date();
    }
    await user.save();
    await endOtherSessions(user._id, signedIn ? request.cookies.get(SESSION_COOKIE)?.value : null);
    return ok({
      reset: true,
      message: signedIn ? "Password changed. Other devices were signed out." : "Password changed. Sign in with your new password.",
    });
  } catch (error) {
    console.error("Password reset failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to reset the password right now.");
  }
}
