import Link from "next/link";
import { connection } from "next/server";
import { LiveDot } from "@/components/creator/ChannelStatsView";
import ExternalPlayer from "@/components/creator/ExternalPlayer";
import { getLiveNow } from "@/lib/creator-data";
import { formatCount } from "@/lib/creator-links";

function twitchUrl(login: string) {
  return `https://www.twitch.tv/${login}`;
}

/** Home page strip: which FaZe channels are streaming on Twitch right now. */
export async function LiveNow() {
  await connection();
  const result = await getLiveNow();
  if (result.status === "not_configured") return null;

  return (
    <section aria-labelledby="live-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="live-heading" className="flex items-center gap-3 font-display text-3xl uppercase tracking-wide">
          {result.status === "ok" && result.live.length > 0 && <LiveDot />}
          Live now
        </h2>
        <p className="text-sm text-muted">FaZe and Hall of FaZe members on Twitch</p>
      </div>

      {result.status === "unavailable" ? (
        <p className="mt-4 text-muted">Live status from Twitch is unavailable right now.</p>
      ) : result.live.length === 0 ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-surface p-5">
          <p className="text-muted">Nobody from the Hall of FaZe is live right now. Check back later.</p>
          <ul className="mt-4 flex flex-wrap gap-2 text-sm">
            {result.channels.map((c) => (
              <li key={c.login}>
                <a
                  href={twitchUrl(c.login)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-full border border-white/15 px-3 py-1 hover:border-accent hover:text-accent"
                >
                  {c.label}
                  <span className="sr-only"> on Twitch (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <ExternalPlayer kind="live" login={result.live[0].login} title={`${result.live[0].label} live on Twitch`} />
            <StreamCaption stream={result.live[0]} />
          </div>
          {result.live.length > 1 && (
            <ul className="space-y-4" aria-label="Also live">
              {result.live.slice(1, 5).map((stream) => (
                <li key={stream.login}>
                  <a href={twitchUrl(stream.login)} target="_blank" rel="noopener noreferrer" className="group flex gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- Twitch preview image */}
                    <img src={stream.thumbnailUrl} alt="" className="aspect-video w-36 shrink-0 rounded-lg bg-white/5 object-cover" />
                    <span className="min-w-0 text-sm">
                      <span className="block font-semibold group-hover:text-accent">{stream.label}</span>
                      <span className="line-clamp-2 text-muted">{stream.title}</span>
                      <span className="text-xs text-muted">{formatCount(stream.viewerCount)} watching</span>
                      <span className="sr-only"> (opens Twitch in a new tab)</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function StreamCaption({ stream }: { stream: { label: string; href: string | null; title: string; gameName: string; viewerCount: number } }) {
  return (
    <div className="mt-3">
      <p className="font-semibold">
        {stream.href ? (
          <Link href={stream.href} className="hover:text-accent">
            {stream.label}
          </Link>
        ) : (
          stream.label
        )}
        <span className="font-normal text-muted">
          {" "}
          · {formatCount(stream.viewerCount)} watching{stream.gameName ? ` · ${stream.gameName}` : ""}
        </span>
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-muted">{stream.title}</p>
    </div>
  );
}

export function LiveNowSkeleton() {
  return <div className="h-40 animate-pulse rounded-xl bg-white/5" aria-label="Checking who's live" />;
}
