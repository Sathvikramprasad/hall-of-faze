import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import UploadForm from "@/components/clips/UploadForm";
import { getViewer } from "@/lib/clip-identity";

export const metadata: Metadata = {
  title: "Upload a clip · Hall of FaZe",
  description: "Submit a clip with a custom thumbnail for review.",
};

async function AuthenticatedUploadForm() {
  await connection();
  const viewer = await getViewer();
  return viewer.userId ? (
    <UploadForm />
  ) : (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6">
      <h2 className="text-xl font-semibold">Sign in to submit</h2>
      <p className="mt-2 opacity-80">Your account keeps private submissions visible only to you and moderators.</p>
      <Link href="/account" className="mt-4 inline-flex rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black">
        Sign in or create an account
      </Link>
    </div>
  );
}

export default function UploadPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm">
        <Link href="/clips" className="opacity-70 hover:opacity-100">
          ← All clips
        </Link>
      </nav>
      <h1 className="text-3xl font-bold tracking-tight">Upload a clip</h1>
      <p className="mt-2 mb-8 opacity-70">
        Add a title, your video and a custom thumbnail. A moderator reviews every clip before it goes public.
      </p>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl border border-white/10 bg-white/5" aria-label="Loading upload form" />}>
        <AuthenticatedUploadForm />
      </Suspense>
    </main>
  );
}
