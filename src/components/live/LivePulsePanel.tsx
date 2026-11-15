import Link from "next/link";
import { connection } from "next/server";
import {
  getLivePulse,
  type LivePulse,
  type PulseSourceStatus,
  type TwitchLiveStream,
  type TwitchPulseClip,
  type YouTubePulseVideo,
} from "@/lib/live-pulse";

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const publishedDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatCompact(value: number | null): string {
  return value === null ? "—" : compactNumber.format(value);
}

function formatPublishedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recent" : publishedDate.format(date);
}

function RemoteImage({ src, alt }: { src: string; alt: string }) {
  if (!src) {
    return <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-black" aria-hidden="true" />;
  }
  return (
    // The source URLs are returned by the official YouTube and Twitch APIs.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
  );
}

function SourceBadge({ source, status }: { source: "youtube" | "twitch"; status: PulseSourceStatus }) {
  const ready = status === "ready";
  const label = source === "youtube" ? "YouTube Data API" : "Twitch API";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        source === "youtube"
          ? "border-red-500/40 bg-red-500/10 text-red-200"
          : "border-violet-500/40 bg-violet-500/10 text-violet-200"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${ready ? "bg-emerald-400" : "bg-zinc-500"}`}
        aria-hidden="true"
      />
      Powered by {label}
    </span>
  );
}

function Metric({ value, label, live = false }: { value: string; label: string; live?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
      <p className="flex items-center gap-2 font-display text-3xl tracking-wide">
        {live && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-fill" aria-hidden="true" />}
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
    </div>
  );
}

function PulseMetrics({ pulse }: { pulse: LivePulse }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Metric value={String(pulse.twitch.streams.length)} label="Live now" live={pulse.twitch.streams.length > 0} />
      <Metric value={formatCompact(pulse.liveViewerCount)} label="Watching live" />
      <Metric value={String(pulse.twitch.trackedChannelCount)} label="FaZe channels" />
      <Metric value={formatCompact(pulse.youtube.subscriberCount)} label="YouTube subscribers" />
    </div>
  );
}

function LiveStreamCard({ stream, featured = false }: { stream: TwitchLiveStream; featured?: boolean }) {
  return (
    <a
      href={stream.url}
      target="_blank"
      rel="noreferrer"
      className={`group block overflow-hidden rounded-2xl border border-white/10 bg-surface transition hover:-translate-y-0.5 hover:border-violet-400 ${
        featured ? "lg:grid lg:grid-cols-[1.35fr_1fr]" : ""
      }`}
    >
      <div className={`relative overflow-hidden ${featured ? "aspect-video lg:aspect-auto lg:min-h-64" : "aspect-video"}`}>
        <RemoteImage src={stream.thumbnailUrl} alt={`${stream.userName} live on Twitch`} />
        <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-md bg-accent-fill px-2.5 py-1 text-xs font-black uppercase tracking-wide text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden="true" />
          Live
        </span>
        <span className="absolute bottom-3 right-3 rounded-md bg-black/80 px-2 py-1 text-xs font-semibold">
          {compactNumber.format(stream.viewerCount)} viewers
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">{stream.gameName}</p>
        <h3 className="mt-2 text-xl font-black leading-tight group-hover:text-violet-300">{stream.userName}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{stream.title}</p>
        <p className="mt-5 text-sm font-bold text-violet-300">Watch on Twitch ↗</p>
      </div>
    </a>
  );
}

function TwitchClipCard({ clip }: { clip: TwitchPulseClip }) {
  return (
    <a
      href={clip.url}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-surface transition hover:-translate-y-0.5 hover:border-violet-400"
    >
      <div className="relative aspect-video overflow-hidden">
        <RemoteImage src={clip.thumbnailUrl} alt={clip.title} />
        <span className="absolute bottom-3 right-3 rounded-md bg-black/80 px-2 py-1 text-xs font-semibold">
          {compactNumber.format(clip.viewCount)} views
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">{clip.broadcasterName}</p>
        <h3 className="mt-2 line-clamp-2 font-bold leading-snug group-hover:text-violet-300">{clip.title}</h3>
      </div>
    </a>
  );
}

function YouTubeCard({ video }: { video: YouTubePulseVideo }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-surface transition hover:-translate-y-0.5 hover:border-red-400"
    >
      <div className="relative aspect-video overflow-hidden">
        <RemoteImage src={video.thumbnailUrl} alt={video.title} />
        <span className="absolute bottom-3 left-3 rounded-md bg-red-600 px-2 py-1 text-xs font-black uppercase text-white">
          YouTube
        </span>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 font-bold leading-snug group-hover:text-red-300">{video.title}</h3>
        <p className="mt-3 text-xs text-muted">{formatPublishedAt(video.publishedAt)}</p>
      </div>
    </a>
  );
}

function SourceMessage({ source, status }: { source: "YouTube" | "Twitch"; status: PulseSourceStatus }) {
  const text = status === "ready"
    ? `${source} has no featured activity to show right now. Check back soon.`
    : status === "unconfigured"
      ? `${source} live data is being connected. Check back shortly.`
      : `${source} is taking a timeout. The rest of Live Pulse is still available.`;
  return (
    <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-muted">
      {text}
    </p>
  );
}

export async function LivePulsePreview() {
  await connection();
  const pulse = await getLivePulse();
  const featuredStream = pulse.twitch.streams[0];
  const featuredClip = pulse.twitch.clips[0];
  const latestVideos = pulse.youtube.videos.slice(0, featuredStream ? 2 : 3);

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(228,0,43,0.18),transparent_38%),#171717] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.28em] text-accent">Now playing</p>
          <h2 id="live-pulse-heading" className="mt-2 font-display text-4xl uppercase tracking-wide sm:text-5xl">
            FaZe Live Pulse
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            See who is live, what is trending on Twitch, and the newest official FaZe uploads in one feed.
          </p>
        </div>
        <Link
          href="/live"
          className="inline-flex min-h-11 items-center rounded-lg border border-white/20 px-4 font-semibold transition hover:border-accent hover:text-accent"
        >
          Open Live Pulse →
        </Link>
      </div>

      <div className="mt-6">
        <PulseMetrics pulse={pulse} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {featuredStream ? (
          <div className="lg:col-span-2"><LiveStreamCard stream={featuredStream} featured /></div>
        ) : featuredClip ? (
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center gap-2 text-sm text-muted">
              <span className="h-2 w-2 rounded-full bg-zinc-500" aria-hidden="true" />
              Nobody is live right now—watch a fan-favorite clip.
            </div>
            <TwitchClipCard clip={featuredClip} />
          </div>
        ) : (
          <div className="lg:col-span-2"><SourceMessage source="Twitch" status={pulse.twitch.status} /></div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {latestVideos.length > 0
            ? latestVideos.slice(0, 2).map((video) => <YouTubeCard key={video.id} video={video} />)
            : <SourceMessage source="YouTube" status={pulse.youtube.status} />}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <SourceBadge source="twitch" status={pulse.twitch.status} />
        <SourceBadge source="youtube" status={pulse.youtube.status} />
      </div>
    </div>
  );
}

export async function LivePulseDashboard() {
  await connection();
  const pulse = await getLivePulse();

  return (
    <div className="space-y-14">
      <PulseMetrics pulse={pulse} />

      <section aria-labelledby="twitch-live-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">Twitch radar</p>
            <h2 id="twitch-live-heading" className="mt-2 font-display text-4xl uppercase tracking-wide">
              Live now
            </h2>
          </div>
          <SourceBadge source="twitch" status={pulse.twitch.status} />
        </div>

        {pulse.twitch.streams.length > 0 ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {pulse.twitch.streams.map((stream) => <LiveStreamCard key={stream.id} stream={stream} />)}
          </div>
        ) : pulse.twitch.status === "ready" ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-surface p-6">
            <p className="flex items-center gap-3 font-bold">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-500" aria-hidden="true" />
              The tracked FaZe channels are offline right now.
            </p>
            <p className="mt-2 text-sm text-muted">Top Twitch moments are waiting below while the squad recharges.</p>
          </div>
        ) : (
          <div className="mt-6"><SourceMessage source="Twitch" status={pulse.twitch.status} /></div>
        )}
      </section>

      {pulse.twitch.clips.length > 0 && (
        <section aria-labelledby="twitch-clips-heading">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">Community replay</p>
          <h2 id="twitch-clips-heading" className="mt-2 font-display text-4xl uppercase tracking-wide">
            Top Twitch moments
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pulse.twitch.clips.map((clip) => <TwitchClipCard key={clip.id} clip={clip} />)}
          </div>
        </section>
      )}

      <section aria-labelledby="youtube-latest-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-300">Official channel</p>
            <h2 id="youtube-latest-heading" className="mt-2 font-display text-4xl uppercase tracking-wide">
              Latest on YouTube
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SourceBadge source="youtube" status={pulse.youtube.status} />
            {pulse.youtube.status === "ready" && (
              <a href={pulse.youtube.channelUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-accent underline underline-offset-4">
                Visit {pulse.youtube.channelTitle} ↗
              </a>
            )}
          </div>
        </div>

        {pulse.youtube.videos.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pulse.youtube.videos.map((video) => <YouTubeCard key={video.id} video={video} />)}
          </div>
        ) : (
          <div className="mt-6"><SourceMessage source="YouTube" status={pulse.youtube.status} /></div>
        )}
      </section>
    </div>
  );
}

function SkeletonCards({ count }: { count: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="aspect-[4/3] animate-pulse rounded-2xl border border-white/10 bg-surface" />
      ))}
    </div>
  );
}

export function LivePulsePreviewSkeleton() {
  return (
    <div className="rounded-3xl border border-white/10 bg-surface p-6 sm:p-8" aria-busy="true">
      <div className="h-12 w-64 animate-pulse rounded bg-white/10" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-black/30" />)}
      </div>
      <div className="mt-6"><SkeletonCards count={3} /></div>
    </div>
  );
}

export function LivePulseDashboardSkeleton() {
  return (
    <div className="space-y-12" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-surface" />)}
      </div>
      <SkeletonCards count={6} />
      <SkeletonCards count={6} />
    </div>
  );
}
