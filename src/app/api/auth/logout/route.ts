import { NextRequest } from "next/server";
import { endSession } from "@/lib/auth";
import { fail, hasValidOrigin, ok } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid request origin.");
  try {
    await connectDB();
    const response = ok({ signedOut: true });
    await endSession(request, response);
    return response;
  } catch (error) {
    console.error("Logout failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to sign out right now.");
  }
}
