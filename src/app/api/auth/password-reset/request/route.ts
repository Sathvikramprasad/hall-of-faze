import type { NextRequest } from "next/server";
import { fail, hasValidOrigin, ok, parseObject } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { issueCode } from "@/lib/account-codes";
import { emailFailure, issueResponse } from "@/lib/account-http";
import { clientIdentifier, consumeRateLimit } from "@/lib/rate-limit";
import UserModel from "@/models/User";

/**
 * POST {}            — signed in: emails a reset code to the account's own email.
 * POST { email }     — signed out ("Forgot password?"): emails a code if that
 *                      account exists. The reply is the same either way, so it
 *                      can't be used to find out who has an account.
 */
export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid request origin.");
  const body = (await parseObject(request)) ?? {};
  try {
    const signedIn = await getCurrentUser(request, { allowUnverified: true });
    if (signedIn) return issueResponse(await issueCode(signedIn, "reset_password"), `We sent a reset code to ${signedIn.email}.`);

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
      return fail(400, "INVALID_INPUT", "Enter the email you signed up with.");
    await connectDB();
    const limit = await consumeRateLimit({ scope: "password-reset-ip", identifier: clientIdentifier(request), limit: 10, windowMs: 60 * 60 * 1000 });
    if (!limit.allowed) return fail(429, "TOO_MANY_REQUESTS", "Too many reset requests. Try again later.");
    const generic = ok({ sent: true, message: "If an account uses that email, we sent it a reset code." });
    const user = await UserModel.findOne({ email });
    if (!user) return generic;
    const result = await issueCode(user, "reset_password");
    return result.status === "sent" ? generic : issueResponse(result, "");
  } catch (error) {
    return emailFailure(error, "Password reset request failed");
  }
}
