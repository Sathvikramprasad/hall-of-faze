/**
 * Small HTTP helpers shared by the clip route handlers.
 *
 * Error shape (all clip endpoints):
 *   { "error": { "code": "invalid_media", "message": "…", "details": [...] } }
 * If the backend branch publishes a shared error contract, adapt `apiError`.
 */
import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { StorageNotConfiguredError, StorageRequestError } from "@/lib/storage";
import { ExternalServiceError } from "@/lib/external-api";
import type { ValidationIssue } from "@/lib/clip-rules";

export type ApiErrorCode =
  | "bad_request"
  | "validation_failed"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "upload_incomplete"
  | "invalid_media"
  | "storage_not_configured"
  | "storage_error"
  | "service_not_configured"
  | "service_unavailable"
  | "ai_not_configured"
  | "ai_error"
  | "internal_error";

export type ApiErrorBody = {
  error: { code: ApiErrorCode; message: string; details?: ValidationIssue[] };
};

const NO_STORE = { "Cache-Control": "private, no-store" };

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: ValidationIssue[],
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message, ...(details && details.length ? { details } : {}) } },
    { status, headers: NO_STORE },
  );
}

export function apiJson<T>(body: T, init: { status?: number } = {}) {
  return NextResponse.json(body, { status: init.status ?? 200, headers: NO_STORE });
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function isClipId(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id) && isValidObjectId(id);
}

/** Maps unexpected errors to a safe API response (no internals leaked). */
export function handleRouteError(error: unknown, context: string) {
  if (error instanceof StorageNotConfiguredError) {
    console.error(`[clips] ${context}:`, error.message);
    return apiError(503, "storage_not_configured", "Clip storage is not configured on this server.");
  }
  if (error instanceof StorageRequestError) {
    console.error(`[clips] ${context}:`, error.message);
    return apiError(502, "storage_error", "Clip storage is temporarily unavailable. Try again.");
  }
  if (error instanceof ExternalServiceError) {
    // Twitch / YouTube lookups: the messages are written for users.
    if (error.kind === "not_configured") {
      console.error(`[clips] ${context}:`, error.message);
      return apiError(503, "service_not_configured", error.message);
    }
    if (error.kind === "unavailable") return apiError(502, "service_unavailable", error.message);
    return apiError(422, "validation_failed", error.message, [{ field: "url", message: error.message }]);
  }
  console.error(`[clips] ${context}:`, error);
  return apiError(500, "internal_error", "Something went wrong. Try again.");
}
