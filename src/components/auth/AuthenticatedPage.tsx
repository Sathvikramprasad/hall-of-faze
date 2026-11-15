import type { ReactNode } from "react";
import { requireAuthenticatedPage } from "@/lib/page-auth";

export default async function AuthenticatedPage({
  children,
  returnTo,
}: {
  children: ReactNode;
  returnTo: string;
}) {
  await requireAuthenticatedPage(returnTo);
  return children;
}
