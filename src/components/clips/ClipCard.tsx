import Link from "next/link";
import { PlatformBadge, VerifiedBadge } from "@/components/creator/CreatorBadges";
import type { PublicClip } from "@/lib/clip-types";

function formatDuration(seconds: number | null): string | null {
  if (!seconds) return null;
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function ClipCard({ clip }: { clip: PublicClip }) {
  const duration = formatDuration(clip.durationSeconds);
  return (
    <Link
      href={`/clips/${clip.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-black/10 bg-black/[.02] transition hover:border-amber-400 dark:border-white/10 dark:bg-white/[.03]"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element -- access-checked redirect to a signed URL */}
        <img
          src={clip.thumbnailUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition group-hover:scale-[1.03]"
        />
        {duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white tabular-nums">
            {duration}
          </span>
        )}
        {clip.fazeDna && (
          <span className="absolute left-2 top-2 rounded-full border border-[#c8ff3d]/50 bg-black/85 px-2.5 py-1 font-mono text-xs font-black text-[#c8ff3d] shadow-lg">
            DNA {clip.fazeDna.overallScore}
          </span>
        )}
        {clip.source && <PlatformBadge platform={clip.source.platform} className="absolute left-2 top-2" />}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <h3 className="line-clamp-2 font-semibold">{clip.title}</h3>
        {clip.source?.verifiedOwner && <VerifiedBadge className="self-start" />}
        <p className="text-xs opacity-60">
          {clip.voteCount} {clip.voteCount === 1 ? "vote" : "votes"} ·{" "}
          {new Date(clip.approvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>
    </Link>
  );
}
