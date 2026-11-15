import type { Metadata } from "next";
import AccountPanel from "@/components/account/AccountPanel";

export const metadata: Metadata = {
  title: "Account · Hall of FaZe",
  description: "Sign in to upload clips and vote in Hall of FaZe challenges.",
};

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Your account</h1>
      <p className="mt-2 mb-8 text-muted">One account powers clip uploads, community votes, and moderator access.</p>
      <AccountPanel />
    </main>
  );
}
