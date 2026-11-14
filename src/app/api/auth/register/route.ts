import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { fail, hasValidOrigin, ok, parseObject } from "@/lib/api";
import { hashPassword, serializeUser, startSession } from "@/lib/auth";
import UserModel from "@/models/User";

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
    const user = await UserModel.create({
      email, displayName, passwordHash: await hashPassword(password), role: "user", socialLinks: {},
    });
    const response = ok({ user: serializeUser(user) }, 201);
    await startSession(response, user._id);
    return response;
  } catch (error) {
    if (error !== null && typeof error === "object" && "code" in error && error.code === 11000)
      return fail(409, "CONFLICT", "An account with this email already exists.");
    console.error("Registration failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to register right now.");
  }
}
