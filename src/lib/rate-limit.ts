import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RateLimit from "@/models/RateLimit";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

function keyFor(scope: string, identifier: string): string {
  return createHash("sha256").update(`${scope}:${identifier}`).digest("hex");
}

/**
 * Atomic, Mongo-backed fixed-window limiter. Identifiers are hashed before
 * storage so email addresses and IP addresses are not kept in this collection.
 */
export async function consumeRateLimit(input: {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
  at?: Date;
}): Promise<RateLimitResult> {
  const now = input.at ?? new Date();
  const windowStartCutoff = new Date(now.getTime() - input.windowMs);
  const expiresAt = new Date(now.getTime() + input.windowMs * 2);
  await connectDB();

  const record = await RateLimit.findOneAndUpdate(
    { _id: keyFor(input.scope, input.identifier) },
    [
      {
        $set: {
          scope: input.scope,
          attempts: {
            $cond: [
              { $or: [{ $not: ["$windowStartedAt"] }, { $lte: ["$windowStartedAt", windowStartCutoff] }] },
              1,
              { $add: [{ $ifNull: ["$attempts", 0] }, 1] },
            ],
          },
          windowStartedAt: {
            $cond: [
              { $or: [{ $not: ["$windowStartedAt"] }, { $lte: ["$windowStartedAt", windowStartCutoff] }] },
              now,
              "$windowStartedAt",
            ],
          },
          expiresAt,
        },
      },
    ],
    { upsert: true, new: true, updatePipeline: true },
  ).lean();

  const attempts = record?.attempts ?? input.limit + 1;
  const startedAt = record?.windowStartedAt ?? now;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((startedAt.getTime() + input.windowMs - now.getTime()) / 1000),
  );
  return {
    allowed: attempts <= input.limit,
    remaining: Math.max(0, input.limit - attempts),
    retryAfterSeconds,
  };
}

export async function resetRateLimit(scope: string, identifier: string): Promise<void> {
  await connectDB();
  await RateLimit.deleteOne({ _id: keyFor(scope, identifier) });
}

export function clientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown-client";
}
