import Link from "next/link";
import {
  CATEGORY_LABELS,
  VAULT_YEARS,
  entryAnchor,
  formatEntryDate,
  getMember,
  getTimelineByYear,
} from "@/lib/vault/queries";
import type { VaultEntry, VaultStat } from "@/lib/vault/types";
import { SourceList } from "./SourceList";
import { VideoEmbed } from "./VideoEmbed";

export function VaultTimeline() {
  const groups = getTimelineByYear();
  const yearsWithEntries = new Set(groups.map((g) => g.year));

  return (
    <div className="lg:grid lg:grid-cols-[9rem_1fr] lg:gap-10">
      {/* Year jump list: horizontal scroller on mobile, sticky column on desktop */}
      <nav aria-label="Jump to year" className="mb-8 lg:mb-0">
        <ol className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-24 lg:flex-col lg:gap-1 lg:overflow-visible">
          {VAULT_YEARS.map((year) =>
            yearsWithEntries.has(year) ? (
              <li key={year}>
                <a
                  href={`#year-${year}`}
                  className="block rounded-md px-3 py-1.5 font-mono text-sm font-semibold transition-colors hover:bg-accent-fill hover:text-white"
                >
                  {year}
                </a>
              </li>
            ) : (
              <li key={year} className="px-3 py-1.5 font-mono text-sm text-muted/50">
                {year}
                <span className="sr-only"> (no entries yet)</span>
              </li>
            ),
          )}
        </ol>
      </nav>

      <div className="space-y-12">
        {groups.map(({ year, entries, stats }) => (
          <section key={year} id={`year-${year}`} aria-labelledby={`year-${year}-heading`} className="scroll-mt-24">
            <h3 id={`year-${year}-heading`} className="font-display text-4xl tracking-wide text-accent-fill">
              {year}
            </h3>
            {stats.length > 0 && (
              <ul aria-label={`${year} subscriber milestones`} className="mt-3 flex flex-wrap gap-2">
                {stats.map((stat) => (
                  <StatMarker key={stat.id} stat={stat} />
                ))}
              </ul>
            )}
            {entries.length > 0 && (
              <ol className="mt-4 space-y-4 border-l-2 border-accent/40 pl-6">
                {entries.map((entry) => (
                  <TimelineEntry key={entry.id} entry={entry} />
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

/** Compact marker for a dated number, e.g. a subscriber count. */
function StatMarker({ stat }: { stat: VaultStat }) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-lg border border-accent-fill/50 bg-accent-fill/10 px-3 py-2 text-sm">
      <span className="font-display text-2xl leading-none">{stat.value}</span>
      <span className="font-semibold">{stat.label}</span>
      <span className="text-muted">
        <time dateTime={stat.date}>{formatEntryDate(stat)}</time>
        {stat.note && <> · {stat.note}</>}
        {" · "}
        {stat.sources.map((source, i) => (
          <span key={source.url}>
            {i > 0 && ", "}
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {source.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </span>
        ))}
      </span>
    </li>
  );
}

function TimelineEntry({ entry }: { entry: VaultEntry }) {
  const members = (entry.memberSlugs ?? [])
    .map((slug) => getMember(slug))
    .filter((m) => m !== undefined);

  return (
    <li className="relative">
      <span
        aria-hidden="true"
        className="absolute -left-[1.95rem] top-6 h-3 w-3 rounded-full border-2 border-background bg-accent"
      />
      <article
        id={entryAnchor(entry.id)}
        className="scroll-mt-24 rounded-xl border border-white/10 bg-surface p-5 target:border-accent target:ring-2 target:ring-accent/40"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <time dateTime={entry.date} className="font-mono text-muted">
            {formatEntryDate(entry)}
          </time>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
            {CATEGORY_LABELS[entry.category]}
          </span>
        </div>
        <h4 className="mt-2 text-lg font-bold">{entry.title}</h4>
        <p className="mt-1 leading-7 text-foreground/90">{entry.summary}</p>
        {entry.video && (
          <div className="mt-4 max-w-2xl">
            <VideoEmbed video={entry.video} />
          </div>
        )}
        {members.length > 0 && (
          <p className="mt-3 text-sm">
            <span className="text-muted">Members: </span>
            {members.map((member, i) => (
              <span key={member.slug}>
                {i > 0 && ", "}
                <Link
                  href={`/vault/members/${member.slug}`}
                  className="font-medium underline decoration-accent underline-offset-4 hover:text-accent"
                >
                  {member.handle}
                </Link>
              </span>
            ))}
          </p>
        )}
        <SourceList sources={entry.sources} className="mt-3" />
      </article>
    </li>
  );
}
