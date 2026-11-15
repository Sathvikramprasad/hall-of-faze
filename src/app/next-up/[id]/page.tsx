import Image from "next/image";
import Link from "next/link";
import { io } from "next/cache";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import VoteButton from "@/components/community/VoteButton";
import { SponsorMark } from "@/components/sponsor/SponsorMark";
import { VideoEmbed } from "@/components/vault/VideoEmbed";
import { getChallengeLeaderboard, getPublicChallenge, type PublicChallenge } from "@/lib/community-data";
import { getRemixMissionForChallenge, type RemixMission } from "@/lib/remix";
import { DEMO_SPONSOR_NAME } from "@/lib/sponsor";
import { getEntry } from "@/lib/vault/queries";

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

/** Steps shown under "How to win"; falls back to the platform's real rules when none are stored. */
function winningSteps(challenge: PublicChallenge, mission: RemixMission | null): string[] {
  if (mission) return mission.howToWin;
  if (challenge.howToWin.length > 0) return challenge.howToWin;
  const deadline = formatDeadline(challenge.endsAt);
  return [
    `Upload an original gameplay clip with a custom thumbnail from this page before ${deadline}.`,
    "Pass moderation. Only approved clips are shown and can receive votes.",
    `Collect the most valid votes by ${deadline}. Each signed-in fan gets one vote per clip this round.`,
    "Ties go to the clip that was approved first, then to the lower clip ID.",
    "The top three are shown on the leaderboard and the Home page.",
  ];
}

function isDemoSponsor(challenge: PublicChallenge) {
  return challenge.sponsorName === DEMO_SPONSOR_NAME;
}

function ChallengeLoading() {
  return <p className="text-zinc-400">Loading challenge and approved entries…</p>;
}

function LegacyRemixMission({ mission, challengeId }: { mission: RemixMission; challengeId: string }) {
  const reference = getEntry(mission.vaultEntryId);
  if (!reference?.video) return null;

  return (
    <section
      id="legacy-mission"
      aria-labelledby="legacy-mission-heading"
      className="scroll-mt-24 border-b border-zinc-800 py-10"
    >
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <VideoEmbed video={reference.video} />
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-500">{mission.eyebrow}</p>
          <h2 id="legacy-mission-heading" className="mt-2 text-3xl font-black sm:text-4xl">
            {mission.title}
          </h2>
          <p className="mt-4 leading-7 text-zinc-300">{mission.description}</p>
          <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">Your mission</p>
            <p className="mt-2 font-semibold leading-7 text-white">{mission.prompt}</p>
          </div>
          <Link
            href={`/upload?challengeId=${encodeURIComponent(challengeId)}&remix=${encodeURIComponent(mission.id)}`}
            className="mt-5 inline-flex rounded-full bg-accent-fill px-6 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-red-900/40 transition hover:scale-105 focus-visible:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            Create your remix →
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mission.rubric.map((criterion) => (
          <div key={criterion.key} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-black text-white">{criterion.label}</h3>
              <span className="font-mono text-sm font-bold text-[#c8ff3d]">
                {Math.round(criterion.weight * 100)}%
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{criterion.description}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-zinc-500">
        Gemini provides coaching scores after approval. Community votes still decide the Top 3.
      </p>
    </section>
  );
}

async function ChallengeContent({ params }: { params: Promise<{ id: string }> }) {
  await io();
  const { id } = await params;
  const challenge = await getPublicChallenge(id);
  if (!challenge) notFound();
  const entries = await getChallengeLeaderboard(challenge.id, challenge.roundKey, 24);
  const remixMission = getRemixMissionForChallenge(challenge.slug);
  const challengeTitle = remixMission
    ? `${challenge.sponsorName ? `${challenge.sponsorName} ` : ""}${remixMission.challengeTitle}`
    : challenge.displayTitle;

  return (
    <>
      <section className="grid gap-8 border-b border-zinc-800 pb-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {challenge.sponsorName ? (
            <p className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-full border border-[#c8ff3d]/40 bg-[#c8ff3d]/10 px-3 py-1.5 text-sm text-zinc-200">
              <SponsorMark className="h-5 w-5" />
              <span>
                Presented by <strong className="text-white">{challenge.sponsorName}</strong>
              </span>
              {isDemoSponsor(challenge) && (
                <span className="rounded-full border border-white/20 px-2 py-px text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                  Demo sponsor
                </span>
              )}
            </p>
          ) : null}
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-500">Round {challenge.roundKey}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">{challengeTitle}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">
            {remixMission?.description ?? challenge.description}
          </p>
        </div>
        <dl className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-sm">
          <div>
            <dt className="font-bold uppercase tracking-wider text-zinc-500">Submissions and voting close</dt>
            <dd className="mt-2 leading-6 text-zinc-200">{formatDeadline(challenge.endsAt)}</dd>
          </div>
          <div className="mt-5 border-t border-zinc-800 pt-5">
            <dt className="font-bold uppercase tracking-wider text-zinc-500">Eligibility</dt>
            <dd className="mt-2 leading-6 text-zinc-200">
              {remixMission?.eligibilitySummary ?? challenge.eligibilitySummary}
            </dd>
          </div>
          {challenge.prizeSummary ? (
            <div className="mt-5 border-t border-zinc-800 pt-5">
              <dt className="font-bold uppercase tracking-wider text-zinc-500">Prize</dt>
              <dd className="mt-2 leading-6 text-zinc-200">{challenge.prizeSummary}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {remixMission && <LegacyRemixMission mission={remixMission} challengeId={challenge.id} />}

      {challenge.prizes.length > 0 ? (
        <section aria-labelledby="prizes-heading" className="border-b border-zinc-800 py-10">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-500">Prizes</p>
          <h2 id="prizes-heading" className="mt-2 text-3xl font-black">What you can win</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {challenge.prizes.map((prize, index) => (
              <li
                key={`${prize.place}-${index}`}
                className={`rounded-3xl border p-6 ${index === 0 ? "border-[#c8ff3d]/50 bg-[#c8ff3d]/5" : "border-zinc-800 bg-zinc-950"}`}
              >
                <p className={`font-mono text-4xl font-black ${index === 0 ? "text-[#c8ff3d]" : "text-red-500"}`}>{prize.place}</p>
                <p className="mt-3 leading-7 text-zinc-200">{prize.reward}</p>
              </li>
            ))}
          </ol>
          {isDemoSponsor(challenge) && (
            <p className="mt-4 text-sm text-zinc-500">
              Demo sponsor and demo prizes for illustration only. No real prizes are awarded.
            </p>
          )}
        </section>
      ) : null}

      <section aria-labelledby="how-to-win-heading" className="border-b border-zinc-800 py-10">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-500">How to win</p>
        <h2 id="how-to-win-heading" className="mt-2 text-3xl font-black">From upload to Top 3</h2>
        <ol className="mt-6 grid gap-3 text-zinc-300 md:grid-cols-2">
          {winningSteps(challenge, remixMission).map((step, index) => (
            <li key={`${index}-${step}`} className="flex gap-4 rounded-2xl bg-zinc-950 p-4">
              <span className="font-black text-[#c8ff3d]">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-500">Approved entries</p>
            <h2 className="mt-2 text-3xl font-black">Vote for your favorite</h2>
          </div>
          <Link href={`/upload?challengeId=${encodeURIComponent(challenge.id)}${remixMission ? `&remix=${encodeURIComponent(remixMission.id)}` : ""}`} className="rounded-full bg-accent-fill px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-900/40 transition-transform duration-200 ease-out hover:scale-105 focus-visible:scale-105 active:scale-100 motion-reduce:transition-none motion-reduce:hover:scale-100">
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
                  <div className="relative">
                    <Image
                      src={entry.thumbnailUrl}
                      alt={`Thumbnail for ${entry.title}`}
                      width={640}
                      height={360}
                      unoptimized
                      className="aspect-video w-full object-cover"
                    />
                    {entry.fazeDnaScore !== null && (
                      <span className="absolute left-3 top-3 rounded-full border border-[#c8ff3d]/50 bg-black/85 px-3 py-1 font-mono text-xs font-black text-[#c8ff3d]">
                        FAZE DNA {entry.fazeDnaScore}
                      </span>
                    )}
                  </div>
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
        <h2 className="text-2xl font-black">Official rules</h2>
        <ol className="mt-5 grid gap-3 text-zinc-300">
          {(remixMission?.rules ?? challenge.rules).map((rule, index) => (
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
