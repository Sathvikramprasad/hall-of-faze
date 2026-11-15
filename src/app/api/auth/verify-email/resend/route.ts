import type { NextRequest } from "next/server";
import { fail, hasValidOrigin, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { issueCode } from "@/lib/account-codes";
import { emailFailure, issueResponse } from "@/lib/account-http";

/** POST — emails a fresh verification code to the signed-in, unverified account. */
export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid request origin.");
  try {
    const user = await getCurrentUser(request, { allowUnverified: true });
    if (!user) return fail(401, "UNAUTHENTICATED", "Sign in to continue.");
    if (user.emailVerified !== false) return ok({ sent: false, message: "Your email is already verified." });
    return issueResponse(await issueCode(user, "verify_email"), `We sent a new code to ${user.email}.`);
  } catch (error) {
    return emailFailure(error, "Resending verification code failed");
  }
}
