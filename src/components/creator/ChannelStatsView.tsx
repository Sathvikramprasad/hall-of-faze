import ExternalPlayer from "@/components/creator/ExternalPlayer";
import { formatCount } from "@/lib/creator-links";
import type { LiveStream } from "@/lib/twitch";
import type { YouTubeChannel } from "@/lib/youtube";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function LiveDot() {
  return (
    <span className="relative inline-flex h-2.5 w-2.5" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-fill opacity-75 motion-reduce:animate-none" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-fill" />
    </span>
  );
}

/**
 * A channel's live Twitch stream (if any) and current YouTube stats with its
 * latest uploads. Used on Vault member pages and My Profile.
 */
export default function ChannelStatsView({
  youtube,
  live,
  name,
}: {
  youtube: YouTubeChannel | null;
  live: LiveStream | null;
  name: string;
}) {
  if (!youtube && !live) return null;
  return (
    <div className="space-y-8">
      {live && (
        <div>
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <LiveDot /> Live on Twitch now
            <span className="font-normal normal-case tracking-normal text-muted">
              · {formatCount(live.viewerCount)} watching{live.gameName ? ` · ${live.gameName}` : ""}
            </span>
          </p>
          <ExternalPlayer kind="live" login={live.login} title={`${name} live on Twitch`} className="mt-3" />
          <p className="mt-2 text-sm">{live.title}</p>
        </div>
      )}

      {youtube && (
        <div>
          <div className="flex flex-wrap items-center gap-4">
            {youtube.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- YouTube image CDN
              <img src={youtube.thumbnailUrl} alt="" className="h-14 w-14 rounded-full bg-white/10" />
            )}
            <div className="min-w-0">
              <p className="font-semibold">{youtube.title}</p>
              <p className="text-sm text-muted">
                {youtube.subscriberCount === null ? "Subscriber count hidden" : `${formatCount(youtube.subscriberCount)} subscribers`}
                {" · "}
                {formatCount(youtube.videoCount)} videos
              </p>
            </div>
            <a
              href={youtube.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto rounded-lg border border-white/20 px-3 py-1.5 text-sm font-semibold hover:border-accent hover:text-accent"
            >
              Open on YouTube<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>

          {youtube.latestUploads.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted">Latest uploads</h3>
              <ul className="mt-3 grid gap-4 sm:grid-cols-3">
                {youtube.latestUploads.map((video) => (
                  <li key={video.id}>
                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="group block">
                      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube image CDN */}
                      <img
                        src={video.thumbnailUrl}
                        alt=""
                        loading="lazy"
                        className="aspect-video w-full rounded-lg bg-white/5 object-cover transition group-hover:opacity-80"
                      />
                      <p className="mt-2 line-clamp-2 text-sm font-medium group-hover:text-accent">{video.title}</p>
                      <time dateTime={video.publishedAt} className="text-xs text-muted">
                        {dateFormat.format(new Date(video.publishedAt))}
                      </time>
                      <span className="sr-only"> (opens on YouTube in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 text-xs text-muted">Live from YouTube. YouTube rounds public subscriber counts.</p>
        </div>
      )}
    </div>
  );
}
