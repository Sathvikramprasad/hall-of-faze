import { NextResponse, type NextRequest } from "next/server";
import type { ApiErrorCode, ApiResponse } from "@/types";

const NO_CACHE = { "Cache-Control": "no-store" };

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true as const, data }, { status, headers: NO_CACHE });
}

export function fail(status: number, code: ApiErrorCode, message: string) {
  return NextResponse.json(
    { success: false as const, error: { code, message } },
    { status, headers: NO_CACHE }
  );
}

export async function parseObject(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body !== null && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Defense in depth for cookie-authenticated mutation requests. */
export function hasValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Non-browser clients may omit Origin.
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}
