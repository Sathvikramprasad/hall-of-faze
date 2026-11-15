import type { AccountUser } from "@/types";

export type Envelope<T> = { success: boolean; data?: T; error?: { message?: string } };

/** fetch() wrapper for the { success, data, error } API envelope. Throws with the server's message. */
export async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new Error("Could not reach the server. Try again.");
  }
  const body = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || !body.success || body.data === undefined) throw new Error(body.error?.message ?? "Something went wrong.");
  return body.data;
}

export const postJson = <T,>(url: string, payload: unknown = {}, method = "POST") =>
  call<T>(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

export type UserResult = { user: AccountUser };
