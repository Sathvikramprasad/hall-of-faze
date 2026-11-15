"use client";

import { useState } from "react";
import { avatarColor, avatarInitial } from "@/lib/avatar-rules";

/** Profile picture, or the first letter of the name when there is none (or it fails to load). */
export default function Avatar({ name, url, seed, size = 96 }: { name: string; url: string | null; seed: string; size?: number }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = url && failedUrl !== url;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-bold text-white ring-2 ring-white/10"
      style={{ width: size, height: size, fontSize: size * 0.45, backgroundColor: showImage ? "transparent" : avatarColor(seed) }}
      aria-hidden={!showImage}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- same-origin redirect to a signed storage URL
        <img src={url} alt={`${name}'s profile picture`} className="h-full w-full object-cover" onError={() => setFailedUrl(url)} />
      ) : (
        avatarInitial(name)
      )}
    </span>
  );
}
