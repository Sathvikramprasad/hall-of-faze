import { NextRequest } from "next/server";
import { fail, hasValidOrigin, ok, parseObject } from "@/lib/api";
import { getCurrentUser, serializeUser } from "@/lib/auth";
import { normalizeSocialLinks } from "@/lib/socials";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return fail(401, "UNAUTHENTICATED", "Sign in to continue.");
    return ok({ user: serializeUser(user) });
  } catch (error) {
    console.error("Profile lookup failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to load profile.");
  }
}

export async function PATCH(request: NextRequest) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid request origin.");
  const body = await parseObject(request);
  if (!body) return fail(400, "INVALID_INPUT", "Expected a JSON object.");
  const keys = Object.keys(body);
  if (keys.length === 0 || keys.some((key) => !["displayName", "socialLinks"].includes(key)))
    return fail(400, "INVALID_INPUT", "Only displayName and socialLinks can be changed.");

  let displayName: string | undefined;
  if ("displayName" in body) {
    if (typeof body.displayName !== "string")
      return fail(400, "INVALID_INPUT", "displayName must be a string.");
    displayName = body.displayName.trim();
    if (displayName.length < 2 || displayName.length > 50)
      return fail(400, "INVALID_INPUT", "Display name must be 2–50 characters.");
  }

  let socialLinks: ReturnType<typeof normalizeSocialLinks> | undefined;
  if ("socialLinks" in body) {
    const raw = body.socialLinks;
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      return fail(400, "INVALID_INPUT", "socialLinks must be an object.");
    const links = raw as Record<string, unknown>;
    if (Object.keys(links).some((key) => !["twitch", "youtube"].includes(key)))
      return fail(400, "INVALID_INPUT", "Only Twitch and YouTube links are supported.");
    if (
      (links.twitch !== undefined && links.twitch !== null && typeof links.twitch !== "string") ||
      (links.youtube !== undefined && links.youtube !== null && typeof links.youtube !== "string")
    ) return fail(400, "INVALID_INPUT", "Social links must be strings or null.");
    try {
      socialLinks = normalizeSocialLinks({
        twitch: links.twitch as string | null | undefined,
        youtube: links.youtube as string | null | undefined,
      });
    } catch (error) {
      return fail(400, "INVALID_INPUT", error instanceof Error ? error.message : "Invalid social links.");
    }
  }

  try {
    const user = await getCurrentUser(request);
    if (!user) return fail(401, "UNAUTHENTICATED", "Sign in to continue.");
    if (displayName !== undefined) user.displayName = displayName;
    if (socialLinks !== undefined) user.socialLinks = socialLinks;
    await user.save();
    return ok({ user: serializeUser(user) });
  } catch (error) {
    console.error("Profile update failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to update profile.");
  }
}
