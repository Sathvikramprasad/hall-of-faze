import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import ClipPlayer from "@/components/clips/ClipPlayer";
import FazeDnaCard from "@/components/clips/FazeDnaCard";
import { getViewer } from "@/lib/clip-identity";
import { canViewClip, findClipById, getClipVoteCount, toOwnerClip } from "@/lib/clips";
import type { ClipStatus } from "@/lib/clip-rules";
import { getRemixMissionForChallengeId } from "@/lib/remix-server";

export const metadata: Metadata = {
  title: "Clip · Hall of FaZe",
};

const STATUS_NOTICE: Record<Exclude<ClipStatus, "approved">, { text: string; tone: string }> = {
  processing: { text: "This upload is still being processed.", tone: "border-sky-500/40 bg-sky-500/10" },
  pending_review: {
    text: "Waiting for moderator review. Only you and moderators can see this clip.",
    tone: "border-amber-500/40 bg-amber-500/10",
  },
  rejected: {
    text: "This clip was not approved. Only you and moderators can see it.",
    tone: "border-red-500/40 bg-red-500/10",
  },
};

async function ClipDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();

  const [doc, viewer] = await Promise.all([findClipById(id), getViewer()]);
  if (!doc || !canViewClip(doc, viewer)) notFound();
  const [voteCount, remixMission] = await Promise.all([
    doc.status === "approved" ? getClipVoteCount(id) : Promise.resolve(undefined),
    getRemixMissionForChallengeId(doc.challengeId),
  ]);
  const clip = toOwnerClip(doc, voteCount);

  return (
    <article className="flex flex-col gap-5">
      {clip.status !== "approved" && (
        <div role="status" className={`rounded-lg border px-4 py-3 text-sm ${STATUS_NOTICE[clip.status].tone}`}>
          {STATUS_NOTICE[clip.status].text}
          {clip.status === "rejected" && clip.rejectionReason && (
            <span className="mt-1 block opacity-80">Reason: {clip.rejectionReason}</span>
          )}
        </div>
      )}

      <ClipPlayer src={clip.videoUrl} poster={clip.thumbnailUrl} title={clip.title} />

      <header>
        {clip.status === "approved" && <Link href={`/players/${doc.uploaderId}`} className="mb-2 block text-sm text-red-400">View player profile and rank →</Link>}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{clip.title}</h1>
        <p className="mt-1 text-sm opacity-60">
          {clip.status === "approved" && clip.approvedAt
            ? `${clip.voteCount} ${clip.voteCount === 1 ? "vote" : "votes"} · approved ${new Date(clip.approvedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`
            : `Submitted ${new Date(clip.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`}
        </p>
      </header>

      {clip.description && <p className="whitespace-pre-line leading-relaxed opacity-90">{clip.description}</p>}

      {remixMission && clip.status === "approved" && clip.fazeDna && (
        <FazeDnaCard analysis={clip.fazeDna} mission={remixMission} />
      )}
      {remixMission && clip.status === "approved" && !clip.fazeDna && (
        <div role="status" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm">
          <p className="font-black text-white">FaZe DNA is {doc.fazeDnaError ? "waiting for a retry" : "being generated"}.</p>
          <p className="mt-1 text-zinc-400">
            {doc.fazeDnaError
              ? "The clip stays approved and vote-eligible. A moderator can retry the AI coaching."
              : "Refresh this page in a moment to see the four-part creative breakdown."}
          </p>
        </div>
      )}
      {remixMission && clip.status === "pending_review" && (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm opacity-80">
          FaZe DNA coaching unlocks as soon as this remix is approved.
        </p>
      )}
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-label="Loading clip">
      <div className="aspect-video w-full animate-pulse rounded-xl bg-black/10 dark:bg-white/10" />
      <div className="h-8 w-2/3 animate-pulse rounded bg-black/10 dark:bg-white/10" />
    </div>
  );
}

export default function ClipPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <nav className="mb-5 text-sm">
        <Link href="/clips" className="opacity-70 hover:opacity-100">
          ← All clips
        </Link>
      </nav>
      <Suspense fallback={<DetailSkeleton />}>
        <ClipDetail params={params} />
      </Suspense>
    </main>
  );
}
