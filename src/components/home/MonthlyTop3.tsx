import Link from "next/link";
import { getMonthlyTop3 } from "@/lib/vault/top3.mock";

// Server component. Rendered inside <Suspense> on the Home page so that when
// getMonthlyTop3() switches to a real API call, the page shell still
// prerenders and the cards stream in.

export async function MonthlyTop3() {
  const { monthLabel, isMock, entries } = await getMonthlyTop3();

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="top3-heading" className="text-2xl font-bold tracking-tight">
          Top 3: {monthLabel}
        </h2>
        {isMock && (
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Sample data
          </span>
        )}
      </div>
      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {entries.map((entry) => {
          const content = (
            <>
              <p className="font-mono text-5xl font-black text-accent">#{entry.rank}</p>
              <p className="mt-4 text-lg font-bold leading-snug">{entry.title}</p>
              <p className="mt-1 text-sm text-muted">{entry.creator}</p>
              <p className="mt-4 flex items-center justify-between text-sm">
                <span className="rounded-full bg-white/10 px-2 py-0.5">{entry.category}</span>
                <span className="font-mono">{entry.votes.toLocaleString("en-US")} votes</span>
              </p>
            </>
          );
          const cardClass =
            "block h-full rounded-2xl border border-white/10 bg-surface p-6 transition-colors";
          return (
            <li key={entry.rank}>
              {entry.href ? (
                <Link href={entry.href} className={`${cardClass} hover:border-accent`}>
                  {content}
                </Link>
              ) : (
                <div className={cardClass}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

export function MonthlyTop3Skeleton() {
  return (
    <>
      <h2 id="top3-heading" className="text-2xl font-bold tracking-tight">
        Top 3
      </h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-3" aria-busy="true">
        {[1, 2, 3].map((rank) => (
          <li key={rank} className="h-52 animate-pulse rounded-2xl border border-white/10 bg-surface" />
        ))}
      </ol>
    </>
  );
}
