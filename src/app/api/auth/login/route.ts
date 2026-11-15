import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { fail, hasValidOrigin, ok, parseObject } from "@/lib/api";
import { serializeUser, startSession, verifyPassword } from "@/lib/auth";
import { consumeRateLimit, resetRateLimit } from "@/lib/rate-limit";
import UserModel from "@/models/User";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid request origin.");
  const body = await parseObject(request);
  if (!body) return fail(400, "INVALID_INPUT", "Expected a JSON object.");
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || email.length > 254 || !password || password.length > 128)
    return fail(400, "INVALID_INPUT", "Email and password are required.");
  try {
    await connectDB();
    const rateLimit = await consumeRateLimit({
      scope: "login-account",
      identifier: email,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      const response = fail(429, "TOO_MANY_REQUESTS", "Too many sign-in attempts. Try again later.");
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return response;
    }
    const user = await UserModel.findOne({ email }).select("+passwordHash");
    if (!user || !(await verifyPassword(password, user.passwordHash)))
      return fail(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    const response = ok({ user: serializeUser(user) });
    await startSession(response, user._id);
    await resetRateLimit("login-account", email).catch((resetError) => {
      console.error("Unable to reset login rate limit:", resetError);
    });
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to sign in right now.");
  }
}
