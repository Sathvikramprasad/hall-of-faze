import Link from "next/link";
import { io } from "next/cache";
import { Suspense } from "react";
import { getChallengeLeaderboard, listActiveChallenges } from "@/lib/community-data";

export const metadata = {
  title: "Monthly Top 3 · Hall of FaZe",
  description: "Deterministic monthly rankings for approved Hall of FaZe challenge clips.",
};

async function LeaderboardContent() {
  await io();
  const [challenge] = await listActiveChallenges();
  if (!challenge) return <p className="text-zinc-400">No active challenge leaderboard is available.</p>;
  const entries = await getChallengeLeaderboard(challenge.id, challenge.roundKey, 3);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-500">{challenge.displayTitle}</p>
          <h2 className="mt-2 text-3xl font-black">Round {challenge.roundKey}</h2>
        </div>
        <Link href={`/next-up/${challenge.id}`} className="text-sm font-bold text-zinc-300 hover:text-red-400">
          View all entries →
        </Link>
      </div>
      {entries.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-300">
          Approved entries will appear here as soon as moderation is complete.
        </p>
      ) : (
        <ol className="mt-8 grid gap-4">
          {entries.map((entry) => (
            <li key={entry.clipId} className="grid grid-cols-[auto_1fr_auto] items-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <span className="text-3xl font-black text-red-500">#{entry.rank}</span>
              <div>
                <Link href={`/clips/${entry.clipId}`} className="font-bold text-white hover:text-red-400">{entry.title}</Link>
                <p className="mt-1 text-sm text-zinc-500">
                  Approved community entry
                  {entry.fazeDnaScore !== null ? ` · FaZe DNA ${entry.fazeDnaScore}` : ""}
                </p>
              </div>
              <span className="font-black text-zinc-200">{entry.voteCount} votes</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-black px-5 py-16 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-500">Hall of FaZe rankings</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Monthly Top 3</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
          Only valid votes for approved challenge entries count. Ties resolve by earlier approval time, then clip ID.
        </p>
        <div className="mt-10">
          <Suspense fallback={<p className="text-zinc-400">Calculating the leaderboard…</p>}>
            <LeaderboardContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
