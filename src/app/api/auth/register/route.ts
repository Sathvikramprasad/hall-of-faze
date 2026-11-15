import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { fail, hasValidOrigin, ok, parseObject } from "@/lib/api";
import { hashPassword, serializeUser, startSession } from "@/lib/auth";
import { clientIdentifier, consumeRateLimit } from "@/lib/rate-limit";
import UserModel from "@/models/User";
import { issueCode } from "@/lib/account-codes";
import { isEmailConfigured } from "@/lib/email";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid request origin.");
  const body = await parseObject(request);
  if (!body) return fail(400, "INVALID_INPUT", "Expected a JSON object.");
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    return fail(400, "INVALID_INPUT", "Enter a valid email address.");
  if (password.length < 12 || password.length > 128)
    return fail(400, "INVALID_INPUT", "Password must be 12–128 characters.");
  if (displayName.length < 2 || displayName.length > 50)
    return fail(400, "INVALID_INPUT", "Display name must be 2–50 characters.");
  try {
    await connectDB();
    const rateLimit = await consumeRateLimit({
      scope: "account-registration",
      identifier: clientIdentifier(request),
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      const response = fail(429, "TOO_MANY_REQUESTS", "Too many account registrations. Try again later.");
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return response;
    }
    const verificationEnabled = isEmailConfigured();
    const user = await UserModel.create({
      email, displayName, passwordHash: await hashPassword(password), role: "user", socialLinks: {},
      // Keep registration usable on deployments that have not configured a
      // transactional email provider yet. Verification turns on automatically
      // as soon as RESEND_API_KEY and EMAIL_FROM are present.
      emailVerified: !verificationEnabled,
      emailVerifiedAt: verificationEnabled ? null : new Date(),
    });
    // Email the verification code. If sending fails the account still exists and
    // the verify screen offers "Send a new code".
    let codeSent = false;
    if (verificationEnabled) {
      try {
        codeSent = (await issueCode(user, "verify_email")).status === "sent";
      } catch (emailError) {
        console.error("Sending the verification email failed:", emailError);
      }
    }
    const serialized = serializeUser(user);
    const response = ok({ user: serialized, authenticated: true, verificationEmailSent: codeSent }, 201);
    try {
      await startSession(response, user._id);
      return response;
    } catch (sessionError) {
      console.error("Account created but session creation failed:", sessionError);
      return ok(
        {
          user: serialized,
          authenticated: false,
          message: "Account created. Sign in to continue.",
        },
        201,
      );
    }
  } catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === 11000)
      return fail(409, "CONFLICT", "An account with this email already exists.");
    console.error("Registration failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to register right now.");
  }
}
