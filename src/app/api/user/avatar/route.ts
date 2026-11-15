import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { fail, hasValidOrigin, ok } from "@/lib/api";
import { getCurrentUser, serializeUser } from "@/lib/auth";
import { AVATAR_MAX_BYTES, avatarExtension } from "@/lib/avatar-rules";
import { sniffImageType } from "@/lib/clip-rules";
import { deleteObjectsQuietly, isStorageConfigured, putObject } from "@/lib/storage";

/** PUT multipart/form-data with `file` (JPEG, PNG or WebP, up to 2 MB) — sets the profile picture. */
export async function PUT(request: NextRequest) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid request origin.");
  if (!isStorageConfigured()) return fail(503, "INTERNAL_ERROR", "Picture uploads aren't set up on this server.");
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > AVATAR_MAX_BYTES + 64 * 1024) return fail(413, "INVALID_INPUT", "Pictures must be 2 MB or smaller.");
  try {
    const user = await getCurrentUser(request);
    if (!user) return fail(401, "UNAUTHENTICATED", "Sign in to continue.");
    let file: FormDataEntryValue | null;
    try {
      file = (await request.formData()).get("file");
    } catch {
      return fail(400, "INVALID_INPUT", "Choose a picture to upload.");
    }
    if (!file || typeof file === "string") return fail(400, "INVALID_INPUT", "Choose a picture to upload.");
    if (file.size === 0 || file.size > AVATAR_MAX_BYTES) return fail(400, "INVALID_INPUT", "Pictures must be 2 MB or smaller.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    // Trust the file's bytes, not its name or the browser's label.
    const type = sniffImageType(bytes);
    if (!type) return fail(400, "INVALID_INPUT", "Use a JPEG, PNG or WebP picture.");

    const key = `avatars/${user._id.toHexString()}/${randomBytes(8).toString("hex")}.${avatarExtension(type)}`;
    await putObject(key, bytes, type);
    const oldKey = user.avatarKey;
    user.avatarKey = key;
    user.avatarContentType = type;
    user.avatarVersion = (user.avatarVersion ?? 0) + 1;
    await user.save();
    await deleteObjectsQuietly([oldKey]);
    return ok({ user: serializeUser(user) });
  } catch (error) {
    console.error("Avatar upload failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to upload the picture right now.");
  }
}

/** DELETE — removes the picture and goes back to the letter avatar. */
export async function DELETE(request: NextRequest) {
  if (!hasValidOrigin(request)) return fail(403, "FORBIDDEN", "Invalid request origin.");
  try {
    const user = await getCurrentUser(request);
    if (!user) return fail(401, "UNAUTHENTICATED", "Sign in to continue.");
    const oldKey = user.avatarKey;
    user.avatarKey = null;
    user.avatarContentType = null;
    user.avatarVersion = (user.avatarVersion ?? 0) + 1;
    await user.save();
    if (oldKey && isStorageConfigured()) await deleteObjectsQuietly([oldKey]);
    return ok({ user: serializeUser(user) });
  } catch (error) {
    console.error("Avatar removal failed:", error);
    return fail(500, "INTERNAL_ERROR", "Unable to remove the picture right now.");
  }
}
