import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import ClipCard from "@/components/clips/ClipCard";
import { listApprovedClips } from "@/lib/clips";

export const metadata: Metadata = {
  title: "Clips · Hall of FaZe",
  description: "Community clips approved by moderators.",
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function first(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : Array.isArray(value) ? (value[0] ?? null) : null;
}

async function ClipFeed({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const challengeId = first(params.challengeId);
  const cursor = first(params.cursor);

  let feed;
  try {
    feed = await listApprovedClips({
      challengeId: challengeId && /^[a-f0-9]{24}$/i.test(challengeId) ? challengeId : null,
      cursor,
    });
  } catch (error) {
    console.error("[clips] feed failed:", error);
    return (
      <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-4">
        Clips could not be loaded right now. Refresh to try again.
      </p>
    );
  }

  if (feed.clips.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-current/30 p-10 text-center">
        <p className="font-medium">{cursor ? "No more clips." : "No approved clips yet."}</p>
        <Link href="/upload" className="mt-3 inline-block text-amber-600 underline dark:text-amber-400">
          Be the first to upload one
        </Link>
      </div>
    );
  }

  const next = new URLSearchParams();
  if (challengeId) next.set("challengeId", challengeId);
  if (feed.nextCursor) next.set("cursor", feed.nextCursor);

  return (
    <>
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {feed.clips.map((clip) => (
          <li key={clip.id}>
            <ClipCard clip={clip} />
          </li>
        ))}
      </ul>
      {feed.nextCursor && (
        <div className="mt-8 text-center">
          <Link href={`/clips?${next.toString()}`} className="rounded-lg border border-current/30 px-4 py-2">
            Older clips →
          </Link>
        </div>
      )}
    </>
  );
}

function FeedSkeleton() {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading clips">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="aspect-video animate-pulse rounded-xl bg-black/10 dark:bg-white/10" />
      ))}
    </ul>
  );
}

export default function ClipsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clips</h1>
          <p className="mt-1 opacity-70">Approved community clips, newest first.</p>
        </div>
        <Link href="/upload" className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black">
          Upload a clip
        </Link>
      </div>
      <Suspense fallback={<FeedSkeleton />}>
        <ClipFeed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
