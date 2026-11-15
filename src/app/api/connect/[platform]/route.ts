import { NextResponse, type NextRequest } from "next/server";
import { fail, hasValidOrigin, ok } from "@/lib/api";
import { getCurrentUser, serializeUser } from "@/lib/auth";
import { isConnectAvailable, isPlatform, startConnect } from "@/lib/creator-connect";

type Context = { params: Promise<{ platform: string }> };

/** GET /api/connect/{twitch|youtube} — sends the signed-in user to Twitch / Google to prove they own a channel. */
export async function GET(request: NextRequest, { params }: Context) {
  const { platform } = await params;
  if (!isPlatform(platform)) return fail(404, "NOT_FOUND", "Unknown platform.");
  const account = new URL("/account", request.nextUrl.origin);
  if (!isConnectAvailable(platform)) {
    account.searchParams.set("connect_error", "not_configured");
    return NextResponse.redirect(account);
  }
  const user = await getCurrentUser(request);
  if (!user) {
    account.searchParams.set("next", "/account");
    return NextResponse.redirect(account);
  }
  return startConnect(request, platform);
}

/** DELETE /api/connect/{twitch|youtube} — removes the verified connection (the profile link stays). */
export async function DELETE(request: NextRequest, { params }: Context) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid request origin.");
  const { platform } = await params;
  if (!isPlatform(platform)) return fail(404, "NOT_FOUND", "Unknown platform.");
  try {
    const user = await getCurrentUser(request);
    if (!user) return fail(401, "UNAUTHENTICATED", "Sign in to continue.");
    user.set(`connections.${platform}`, null);
    await user.save();
    return ok({ user: serializeUser(user) });
  } catch (error) {
    console.error("Disconnect failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to disconnect right now.");
  }
}
