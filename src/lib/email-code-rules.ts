/**
 * Pure rules for emailed one-time codes (no database), so they can be unit-tested.
 */
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 15 * 60 * 1000;
export const CODE_MAX_ATTEMPTS = 5;
/** Minimum wait before another code can be emailed for the same purpose. */
export const CODE_RESEND_COOLDOWN_MS = 60 * 1000;

export function generateCode(): string {
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

/** Codes are bound to the account and purpose, so a reset code can't verify an email. */
export function hashCode(userId: string, purpose: string, code: string): string {
  return createHash("sha256").update(`${userId}:${purpose}:${code}`).digest("hex");
}

/** Accepts "123 456", "123-456" etc. Returns the 6 digits or null. */
export function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string" || input.length > 20) return null;
  const digits = input.replace(/[\s-]/g, "");
  return new RegExp(`^\\d{${CODE_LENGTH}}$`).test(digits) ? digits : null;
}

export function codeMatches(storedHash: string, userId: string, purpose: string, code: string): boolean {
  const expected = Buffer.from(storedHash, "hex");
  const actual = Buffer.from(hashCode(userId, purpose, code), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

export function passwordProblem(password: unknown): string | null {
  if (typeof password !== "string") return "Enter a new password.";
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX)
    return `Password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters.`;
  return null;
}
