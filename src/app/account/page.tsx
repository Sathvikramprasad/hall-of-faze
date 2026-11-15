import type { Metadata } from "next";
import { Suspense } from "react";
import AccountPanel from "@/components/account/AccountPanel";
import { safeAuthReturnPath } from "@/lib/auth-navigation";

export const metadata: Metadata = {
  title: "My Profile · Hall of FaZe",
  description: "Sign in, manage your profile and see every clip you've submitted to Hall of FaZe challenges.",
};

type SearchParams = Promise<{ next?: string | string[] }>;

async function AccountContent({ searchParams }: { searchParams: SearchParams }) {
  const nextValue = (await searchParams).next;
  const nextPath = safeAuthReturnPath(
    typeof nextValue === "string" ? nextValue : Array.isArray(nextValue) ? nextValue[0] : null,
  );

  return <AccountPanel nextPath={nextPath} />;
}

export default function AccountPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <AccountContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
