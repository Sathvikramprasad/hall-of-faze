import { NextResponse, type NextRequest } from "next/server";

export type CommunityErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DEPENDENCY_UNAVAILABLE"
  | "INTERNAL_ERROR";

const NO_CACHE = { "Cache-Control": "no-store" };

export function communityOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true as const, data }, { status, headers: NO_CACHE });
}

export function communityFail(status: number, code: CommunityErrorCode, message: string) {
  return NextResponse.json(
    { success: false as const, error: { code, message } },
    { status, headers: NO_CACHE },
  );
}

export async function parseCommunityObject(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body !== null && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Defense in depth for cookie-authenticated mutations. */
export function hasValidCommunityOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}
