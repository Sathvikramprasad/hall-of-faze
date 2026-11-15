"use client";

import { useSyncExternalStore } from "react";
import { clipEmbedUrl, twitchChannelEmbedUrl, type ClipPlatform } from "@/lib/creator-links";

const subscribe = () => () => {};
/** Twitch's player only loads when told the page's own domain, which is only known in the browser. */
function useHostname(): string | null {
  return useSyncExternalStore(subscribe, () => window.location.hostname, () => null);
}

type Props = { title: string; className?: string } & (
  | { kind: "clip"; platform: ClipPlatform; id: string }
  | { kind: "live"; login: string }
);

/** Twitch / YouTube player in a 16:9 frame. */
export default function ExternalPlayer(props: Props) {
  const host = useHostname();
  const src = !host
    ? null
    : props.kind === "live"
      ? twitchChannelEmbedUrl(props.login, host)
      : clipEmbedUrl({ platform: props.platform, id: props.id }, host);

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-xl bg-black ${props.className ?? ""}`}>
      {src ? (
        <iframe
          src={src}
          title={props.title}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="absolute inset-0 animate-pulse bg-white/5" aria-hidden="true" />
      )}
    </div>
  );
}
