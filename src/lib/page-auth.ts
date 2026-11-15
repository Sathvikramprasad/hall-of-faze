import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserFromSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { signInHref } from "@/lib/auth-navigation";

/** Redirect a signed-out server-rendered page before any protected data loads. */
export async function requireAuthenticatedPage(returnTo: string): Promise<void> {
  const jar = await cookies();
  const user = await getUserFromSessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!user) redirect(signInHref(returnTo));
}
