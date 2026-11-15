/**
 * Emailed one-time codes for email verification and password reset. Server-only.
 */
import type { HydratedDocument } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { codeEmail, sendEmail } from "@/lib/email";
import {
  CODE_MAX_ATTEMPTS,
  CODE_RESEND_COOLDOWN_MS,
  CODE_TTL_MS,
  codeMatches,
  generateCode,
  hashCode,
} from "@/lib/email-code-rules";
import { consumeRateLimit } from "@/lib/rate-limit";
import EmailCode, { type EmailCodePurpose } from "@/models/EmailCode";
import type { IUser } from "@/models/User";

export type IssueResult =
  | { status: "sent"; delivered: boolean }
  | { status: "cooldown"; retryAfterSeconds: number }
  | { status: "rate_limited"; retryAfterSeconds: number };

/** Creates a new code (replacing any older one) and emails it to the account's address. */
export async function issueCode(user: HydratedDocument<IUser>, purpose: EmailCodePurpose, now = new Date()): Promise<IssueResult> {
  await connectDB();
  const userId = user._id.toHexString();
  const existing = await EmailCode.findOne({ userId: user._id, purpose }).lean().exec();
  if (existing && now.getTime() - existing.sentAt.getTime() < CODE_RESEND_COOLDOWN_MS) {
    return {
      status: "cooldown",
      retryAfterSeconds: Math.ceil((CODE_RESEND_COOLDOWN_MS - (now.getTime() - existing.sentAt.getTime())) / 1000),
    };
  }
  const limit = await consumeRateLimit({ scope: `email-code:${purpose}`, identifier: userId, limit: 6, windowMs: 60 * 60 * 1000 });
  if (!limit.allowed) return { status: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds };

  const code = generateCode();
  await EmailCode.findOneAndUpdate(
    { userId: user._id, purpose },
    {
      $set: {
        codeHash: hashCode(userId, purpose, code),
        attempts: 0,
        sentAt: now,
        expiresAt: new Date(now.getTime() + CODE_TTL_MS),
      },
    },
    { upsert: true },
  ).exec();
  try {
    const { delivered } = await sendEmail(codeEmail({ to: user.email, displayName: user.displayName, code, purpose }));
    return { status: "sent", delivered };
  } catch (error) {
    // Let the user try again right away instead of waiting out the cooldown.
    await EmailCode.deleteOne({ userId: user._id, purpose }).exec();
    throw error;
  }
}

export type CheckResult = "ok" | "invalid" | "expired" | "too_many_attempts";

/** Checks a code. A correct code is consumed; wrong guesses count toward the limit. */
export async function consumeCode(
  userId: HydratedDocument<IUser>["_id"],
  purpose: EmailCodePurpose,
  code: string,
  now = new Date(),
): Promise<CheckResult> {
  await connectDB();
  const record = await EmailCode.findOne({ userId, purpose }).exec();
  if (!record || record.expiresAt <= now) return "expired";
  if (record.attempts >= CODE_MAX_ATTEMPTS) return "too_many_attempts";
  if (!codeMatches(record.codeHash, userId.toHexString(), purpose, code)) {
    record.attempts += 1;
    await record.save();
    return record.attempts >= CODE_MAX_ATTEMPTS ? "too_many_attempts" : "invalid";
  }
  await EmailCode.deleteOne({ _id: record._id }).exec();
  return "ok";
}

export const CHECK_MESSAGES: Record<Exclude<CheckResult, "ok">, string> = {
  invalid: "That code isn't right. Check the email and try again.",
  expired: "That code has expired. Send a new one.",
  too_many_attempts: "Too many wrong codes. Send a new one.",
};
