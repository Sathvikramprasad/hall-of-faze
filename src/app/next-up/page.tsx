import Link from "next/link";
import { io } from "next/cache";
import { Suspense } from "react";
import { SponsorMark } from "@/components/sponsor/SponsorMark";
import { listActiveChallenges } from "@/lib/community-data";
import { DEMO_SPONSOR_NAME } from "@/lib/sponsor";

export const metadata = {
  title: "Next Up Challenges · Hall of FaZe",
  description: "Active Hall of FaZe community clip challenges.",
};

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

async function ChallengeList() {
  await io();
  const challenges = await listActiveChallenges();
  if (challenges.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
        No challenge is accepting entries or votes right now. Check back for the next round.
      </p>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {challenges.map((challenge) => (
        <article key={challenge.id} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl shadow-black/20">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="rounded-full bg-red-600/20 px-3 py-1 text-red-400">Active</span>
            <span className="text-zinc-500">Round {challenge.roundKey}</span>
          </div>
          {challenge.sponsorName ? (
            <p className="mb-2 flex items-center gap-2 text-sm text-zinc-300">
              <SponsorMark className="h-4 w-4" />
              Presented by <strong className="text-white">{challenge.sponsorName}</strong>
              {challenge.sponsorName === DEMO_SPONSOR_NAME && (
                <span className="rounded-full border border-white/20 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  Demo
                </span>
              )}
            </p>
          ) : null}
          <h2 className="text-2xl font-black tracking-tight text-white">{challenge.displayTitle}</h2>
          <p className="mt-3 leading-7 text-zinc-300">{challenge.description}</p>
          <dl className="mt-6 grid gap-4 border-t border-zinc-800 pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-zinc-500">Voting closes</dt>
              <dd className="mt-1 text-zinc-200">{formatDeadline(challenge.endsAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-zinc-500">Eligibility</dt>
              <dd className="mt-1 text-zinc-200">{challenge.eligibilitySummary}</dd>
            </div>
            {challenge.prizes[0] ? (
              <div className="sm:col-span-2">
                <dt className="font-semibold text-zinc-500">Top prize</dt>
                <dd className="mt-1 text-zinc-200">
                  <span className="font-bold text-[#c8ff3d]">{challenge.prizes[0].place}:</span> {challenge.prizes[0].reward}
                </dd>
              </div>
            ) : null}
          </dl>
          <Link
            href={`/next-up/${challenge.id}`}
            className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-red-500 hover:text-white"
          >
            View challenge
          </Link>
        </article>
      ))}
    </div>
  );
}

export default function NextUpPage() {
  return (
    <main className="min-h-screen bg-black px-5 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-500">FaZe Next Up</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Compete for the monthly Top 3</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
          Enter an active challenge, submit an original gaming clip, and earn verified community votes after approval.
        </p>
        <div className="mt-10">
          <Suspense fallback={<p className="text-zinc-400">Loading active challenges…</p>}>
            <ChallengeList />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
