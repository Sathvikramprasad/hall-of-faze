import type { Metadata } from "next";
import { Suspense } from "react";
import AccountPanel from "@/components/account/AccountPanel";
import { safeAuthReturnPath } from "@/lib/auth-navigation";

export const metadata: Metadata = {
  title: "Account · Hall of FaZe",
  description: "Sign in to upload clips and vote in Hall of FaZe challenges.",
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
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Your account</h1>
      <p className="mt-2 mb-8 text-muted">One account powers clip uploads, community votes, and moderator access.</p>
      <Suspense fallback={<p className="text-sm text-muted">Loading account…</p>}>
        <AccountContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
