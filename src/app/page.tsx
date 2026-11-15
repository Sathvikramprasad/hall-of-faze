import Link from "next/link";
import { Suspense } from "react";
import { OpenFazeBotButton } from "@/components/faze-bot/OpenFazeBotButton";
import { HomeHero } from "@/components/home/HomeHero";
import { MonthlyTop3, MonthlyTop3Skeleton } from "@/components/home/MonthlyTop3";
import { PageShell } from "@/components/layout/PageShell";
import { LEGACY_CHALLENGE_HREF } from "@/lib/site";
import { entryAnchor, formatEntryDate, getVaultEntries } from "@/lib/vault/queries";

export default function Home() {
  const entries = getVaultEntries();
  const firstEntry = entries[0];
  const latestEntries = entries.slice(-3).reverse();

  return (
    <PageShell>
      <HomeHero />

      <div id="home-content" className="mx-auto max-w-6xl scroll-mt-4 space-y-20 px-4 py-16 sm:px-6">
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
