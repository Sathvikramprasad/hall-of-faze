import type { Metadata } from "next";
import { Suspense } from "react";
import AccountPanel from "@/components/account/AccountPanel";
import { safeAuthReturnPath } from "@/lib/auth-navigation";

export const metadata: Metadata = {
  title: "My Profile · Hall of FaZe",
  description: "Sign in, manage your profile and see every clip you've submitted to Hall of FaZe challenges.",
};

type SearchParams = Promise<{
  next?: string | string[];
  mode?: string | string[];
}>;

async function AccountContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const nextValue = params.next;
  const modeValue = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const nextPath = safeAuthReturnPath(
    typeof nextValue === "string" ? nextValue : Array.isArray(nextValue) ? nextValue[0] : null,
  );

  return <AccountPanel nextPath={nextPath} initialMode={modeValue === "register" ? "register" : "login"} />;
}

export default function AccountPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Suspense fallback={<p className="text-sm text-muted">Loading account…</p>}>
        <AccountContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
