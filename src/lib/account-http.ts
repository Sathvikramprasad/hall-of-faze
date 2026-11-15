import { fail, ok } from "@/lib/api";
import { EmailNotConfiguredError, EmailSendError } from "@/lib/email";
import type { IssueResult } from "@/lib/account-codes";

/** Turns an issueCode() result into the API response. */
export function issueResponse(result: IssueResult, sentMessage: string) {
  if (result.status === "sent") return ok({ sent: true, message: sentMessage, devMode: !result.delivered });
  const response = fail(
    429,
    "TOO_MANY_REQUESTS",
    result.status === "cooldown"
      ? `Wait ${result.retryAfterSeconds} seconds before asking for another code.`
      : "Too many codes requested. Try again later.",
  );
  response.headers.set("Retry-After", String(result.retryAfterSeconds));
  return response;
}

export function emailFailure(error: unknown, context: string) {
  if (error instanceof EmailNotConfiguredError) return fail(503, "INTERNAL_ERROR", "Email isn't set up on this server yet.");
  if (error instanceof EmailSendError) {
    console.error(`${context}:`, error.message);
    return fail(502, "INTERNAL_ERROR", "We couldn't send the email. Try again in a minute.");
  }
  console.error(`${context}:`, error);
  return fail(500, "INTERNAL_ERROR", "Something went wrong. Try again.");
}
