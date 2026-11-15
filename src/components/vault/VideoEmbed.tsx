import type { VideoEmbed as VideoEmbedData } from "@/lib/vault/types";

// Privacy-friendly YouTube embed with a visible credit line.
export function VideoEmbed({ video }: { video: VideoEmbedData }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-white/10 bg-surface">
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtubeId)}`}
          title={video.title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full"
        />
      </div>
      <figcaption className="px-4 py-3 text-sm">
        <span className="font-medium">{video.title}</span>
        <span className="text-muted">
          {" "}
          · Credit: {video.credit}
          {video.year ? ` (${video.year})` : ""} ·{" "}
          <a
            href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.youtubeId)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Watch on YouTube<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </span>
      </figcaption>
    </figure>
  );
}
