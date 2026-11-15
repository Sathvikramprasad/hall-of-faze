import Image from "next/image";
import Link from "next/link";
import { io } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import VoteButton from "@/components/community/VoteButton";
import { getChallengeLeaderboard, getPublicChallenge } from "@/lib/community-data";

function ChallengeLoading() {
  return <p className="text-zinc-400">Loading challenge and approved entries…</p>;
}

async function ChallengeContent({ params }: { params: Promise<{ id: string }> }) {
  await io();
  const { id } = await params;
  const challenge = await getPublicChallenge(id);
  if (!challenge) notFound();
  const entries = await getChallengeLeaderboard(challenge.id, challenge.roundKey, 24);

  return (
    <>
      <section className="grid gap-8 border-b border-zinc-800 pb-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-500">Round {challenge.roundKey}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">{challenge.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">{challenge.description}</p>
        </div>
        <dl className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-sm">
          <div>
            <dt className="font-bold uppercase tracking-wider text-zinc-500">Eligibility</dt>
            <dd className="mt-2 leading-6 text-zinc-200">{challenge.eligibilitySummary}</dd>
          </div>
          {challenge.prizeSummary ? (
            <div className="mt-5 border-t border-zinc-800 pt-5">
              <dt className="font-bold uppercase tracking-wider text-zinc-500">Prize</dt>
              <dd className="mt-2 leading-6 text-zinc-200">{challenge.prizeSummary}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-500">Approved entries</p>
            <h2 className="mt-2 text-3xl font-black">Vote for your favorite</h2>
          </div>
          <Link href="/upload" className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-bold hover:border-red-500 hover:text-red-400">
            Submit a clip
          </Link>
        </div>

        {entries.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
            No approved clips are eligible yet. Approved submissions will appear here automatically.
          </p>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {entries.map((entry) => (
              <article key={entry.clipId} className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
                <Link href={`/clips/${entry.clipId}`} className="block bg-zinc-900">
                  <Image
                    src={entry.thumbnailUrl}
                    alt={`Thumbnail for ${entry.title}`}
                    width={640}
                    height={360}
                    unoptimized
                    className="aspect-video w-full object-cover"
                  />
                </Link>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-white">{entry.title}</h3>
                    <span className="text-sm font-black text-red-500">#{entry.rank}</span>
                  </div>
                  <div className="mt-5">
                    <VoteButton
                      clipId={entry.clipId}
                      challengeId={challenge.id}
                      initialVoteCount={entry.voteCount}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-zinc-800 pt-10">
        <h2 className="text-2xl font-black">Rules</h2>
        <ol className="mt-5 grid gap-3 text-zinc-300">
          {challenge.rules.map((rule, index) => (
            <li key={`${index}-${rule}`} className="flex gap-4 rounded-2xl bg-zinc-950 p-4">
              <span className="font-black text-red-500">{index + 1}</span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

export default function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="min-h-screen bg-black px-5 py-12 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/next-up" className="text-sm font-bold text-zinc-400 hover:text-white">← All challenges</Link>
        <div className="mt-8">
          <Suspense fallback={<ChallengeLoading />}>
            <ChallengeContent params={params} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
