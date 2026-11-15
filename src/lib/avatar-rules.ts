/** Profile picture rules. Pure; safe for client components. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp";

export function avatarExtension(type: "image/jpeg" | "image/png" | "image/webp"): string {
  return type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
}

/** The default picture is the first letter (or number) of the display name. */
export function avatarInitial(displayName: string): string {
  const match = displayName.trim().match(/[\p{L}\p{N}]/u);
  return match ? match[0].toLocaleUpperCase() : "?";
}

/** A stable background colour per name so letter avatars aren't all identical. */
const COLORS = ["#e11d48", "#2563eb", "#7c3aed", "#059669", "#d97706", "#0891b2", "#db2777", "#4f46e5"];
export function avatarColor(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return COLORS[hash % COLORS.length];
}
