const PROTECTED_RETURN_PATHS = ["/clips", "/next-up", "/upload"];

/** Only allow redirects back to known in-app protected experiences. */
export function safeAuthReturnPath(input: string | null | undefined): string | null {
  if (!input || !input.startsWith("/") || input.startsWith("//") || input.includes("\\")) {
    return null;
  }
  if (input === "/vault#historian") return input;
  const pathname = input.split(/[?#]/, 1)[0];
  return PROTECTED_RETURN_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
    ? input
    : null;
}

export function signInHref(returnTo: string): string {
  const safeReturnTo = safeAuthReturnPath(returnTo);
  return safeReturnTo ? `/account?next=${encodeURIComponent(safeReturnTo)}` : "/account";
}
