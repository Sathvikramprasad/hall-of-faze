import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { OpenFazeBotButton } from "@/components/faze-bot/OpenFazeBotButton";
import { MonthlyTop3, MonthlyTop3Skeleton } from "@/components/home/MonthlyTop3";
import { PageShell } from "@/components/layout/PageShell";
import { LivePulsePreview, LivePulsePreviewSkeleton } from "@/components/live/LivePulsePanel";
import { LEGACY_CHALLENGE_HREF } from "@/lib/site";
import { entryAnchor, formatEntryDate, getVaultEntries } from "@/lib/vault/queries";

export default function Home() {
  const entries = getVaultEntries();
  const firstEntry = entries[0];
  const latestEntries = entries.slice(-3).reverse();

  return (
    <PageShell>
      {/* Hero */}
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_minmax(0,24rem)] md:py-20">
          <div>
            <p className="font-mono text-sm font-semibold uppercase tracking-widest text-accent">
              Since 2010
            </p>
            <h1 className="mt-3 font-display text-6xl uppercase leading-none tracking-wide sm:text-8xl">
              Hall of <span className="text-accent-fill">FaZe</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Relive the moments that built the clan, see what the community is watching this
              month, and take on a Legacy Challenge.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/vault"
                className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent-fill px-6 font-semibold text-white transition-colors hover:bg-accent-fill-strong"
              >
                Explore the Vault
              </Link>
              <Link
                href={LEGACY_CHALLENGE_HREF}
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 px-6 font-semibold transition-colors hover:border-accent hover:text-accent"
              >
                Take a Legacy Challenge
              </Link>
            </div>
          </div>

          {/* Official "Logo 1" on the red/black Tiger Camo, as in FaZe's logo usage guide.
              The logo spans 60% of the panel, leaving the clear space the guidelines ask for. */}
          <div className="faze-camo flex aspect-[4/3] items-center justify-center rounded-2xl">
            <Image
              src="/brand/faze-logo-white-double-stroke.png"
              alt="FaZe Clan logo"
              width={280}
              height={188}
              priority
              className="h-auto w-3/5"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-20 px-4 py-16 sm:px-6">
        {/* Current FaZe activity from the official YouTube and Twitch APIs. */}
        <section aria-labelledby="live-pulse-heading">
          <Suspense fallback={<LivePulsePreviewSkeleton />}>
            <LivePulsePreview />
          </Suspense>
        </section>

        {/* Monthly Top 3 */}
        <section aria-labelledby="top3-heading">
          <Suspense fallback={<MonthlyTop3Skeleton />}>
            <MonthlyTop3 />
          </Suspense>
        </section>

        {/* From the Vault */}
        <section aria-labelledby="vault-teaser-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="vault-teaser-heading" className="font-display text-3xl uppercase tracking-wide">
              From the Vault
            </h2>
            <Link href="/vault" className="text-sm font-medium text-accent underline underline-offset-4">
              See the full timeline
            </Link>
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[firstEntry, ...latestEntries].filter(Boolean).map((entry, i) => (
              <li key={entry.id}>
                <Link
                  href={`/vault#${entryAnchor(entry.id)}`}
                  className="block h-full rounded-xl border border-white/10 bg-surface p-5 transition-colors hover:border-accent"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    {i === 0 ? "Where it started" : "Recent"}
                  </p>
                  <time dateTime={entry.date} className="mt-2 block font-mono text-sm text-muted">
                    {formatEntryDate(entry)}
                  </time>
                  <p className="mt-1 font-bold">{entry.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Legacy Challenge + FaZe Bot */}
        <section aria-label="Get involved" className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-accent/40 bg-accent/10 p-6 sm:p-8">
            <h2 className="font-display text-3xl uppercase tracking-wide">Legacy Challenges</h2>
            <p className="mt-2 text-muted">
              Recreate an iconic FaZe moment, submit your clip, and compete for this month&apos;s
              Top 3.
            </p>
            <Link
              href={LEGACY_CHALLENGE_HREF}
              className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-accent-fill px-5 font-semibold text-white transition-colors hover:bg-accent-fill-strong"
            >
              View challenges
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-surface p-6 sm:p-8">
            <h2 className="font-display text-3xl uppercase tracking-wide">Meet FaZe Bot</h2>
            <p className="mt-2 text-muted">
              Get account help before signing in, then ask follow-up questions about FaZe using
              the sourced Vault and live web results.
            </p>
            <OpenFazeBotButton />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
