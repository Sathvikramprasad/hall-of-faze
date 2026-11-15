import { Suspense, type ReactNode } from "react";
import AuthenticatedPage from "@/components/auth/AuthenticatedPage";

export default function ChallengesLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="mx-auto w-full max-w-6xl px-4 py-10 text-sm text-muted">Checking sign-in…</p>}>
      <AuthenticatedPage returnTo="/next-up">{children}</AuthenticatedPage>
    </Suspense>
  );
}
