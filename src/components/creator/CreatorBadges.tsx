import type { ClipPlatform } from "@/lib/creator-links";

const PLATFORM = {
  twitch: { label: "Twitch", className: "bg-[#9146ff] text-white" },
  youtube: { label: "YouTube", className: "bg-[#ff0000] text-white" },
} as const;

export function PlatformBadge({ platform, className = "" }: { platform: ClipPlatform; className?: string }) {
  const p = PLATFORM[platform];
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${p.className} ${className}`}>
      {p.label}
    </span>
  );
}

/** Shown when the person who entered the clip proved the channel is theirs. */
export function VerifiedBadge({ label = "Verified creator", className = "" }: { label?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-300 ${className}`}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
        <path d="M8 0l2 1.6 2.5-.3.9 2.4 2.4.9-.3 2.5L16 8l-1.6 2 .3 2.5-2.4.9-.9 2.4-2.5-.3L8 16l-2-1.6-2.5.3-.9-2.4-2.4-.9.3-2.5L0 8l1.6-2-.3-2.5 2.4-.9.9-2.4 2.5.3zm-1 11.2l5-5-1.2-1.2L7 8.8 5.2 7 4 8.2z" />
      </svg>
      {label}
    </span>
  );
}
