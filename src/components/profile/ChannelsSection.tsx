"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import ChannelStatsView from "@/components/creator/ChannelStatsView";
import { VerifiedBadge } from "@/components/creator/CreatorBadges";
import { call, postJson, type UserResult } from "@/components/profile/api";
import type { ClipPlatform } from "@/lib/creator-links";
import type { LiveStream } from "@/lib/twitch";
import type { YouTubeChannel } from "@/lib/youtube";
import type { AccountUser } from "@/types";

type ChannelsResult = {
  twitch: { lookupsAvailable: boolean; connectAvailable: boolean; ownChannelRequiredForLinks: boolean; login: string | null; live: LiveStream | null };
  youtube: { lookupsAvailable: boolean; connectAvailable: boolean; ownChannelRequiredForLinks: boolean; channel: YouTubeChannel | null };
};

const NAME: Record<ClipPlatform, string> = { twitch: "Twitch", youtube: "YouTube" };

const CONNECT_ERRORS: Record<string, string> = {
  cancelled: "Connecting was cancelled.",
  expired: "That sign-in link expired. Try connecting again.",
  taken: "That channel is already verified on another Hall of FaZe account.",
  no_channel: "That Google account doesn't have a YouTube channel. Sign in with the account that owns your channel.",
  not_configured: "Connecting accounts isn't set up on this server yet.",
  signed_out: "Your session ended. Sign in and try again.",
  failed: "Couldn't connect your account. Try again.",
};

type Note = { tone: "ok" | "error"; text: string };

/** The result of a Connect flow, from /account?connected=twitch or ?connect_error=… */
function connectResultNote(): Note | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const connected = params.get("connected");
  const error = params.get("connect_error");
  if (connected === "twitch" || connected === "youtube") {
    return { tone: "ok", text: `${NAME[connected]} connected. You're a verified creator.` };
  }
  return error ? { tone: "error", text: CONNECT_ERRORS[error] ?? CONNECT_ERRORS.failed } : null;
}

/** Twitch / YouTube links, "Connect" (verified creator) buttons, and the user's live status and channel stats. */
export default function ChannelsSection({ user, onUserChange }: { user: AccountUser; onUserChange: (user: AccountUser) => void }) {
  const [channels, setChannels] = useState<ChannelsResult | null>(null);
  const [note, setNote] = useState<Note | null>(connectResultNote);

  // Once the Connect result is on screen, tidy it out of the address bar.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("connected") && !params.has("connect_error")) return;
    params.delete("connected");
    params.delete("connect_error");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, []);

  const linksKey = `${user.socialLinks.twitch ?? ""}|${user.socialLinks.youtube ?? ""}|${user.connections.twitch?.login ?? ""}|${user.connections.youtube?.channelId ?? ""}`;
  useEffect(() => {
    let cancelled = false;
    call<ChannelsResult>("/api/user/channels")
      .then((result) => !cancelled && setChannels(result))
      .catch(() => !cancelled && setChannels(null));
    return () => {
      cancelled = true;
    };
  }, [linksKey]);

  async function disconnect(platform: ClipPlatform) {
    setNote(null);
    try {
      const result = await call<UserResult>(`/api/connect/${platform}`, { method: "DELETE" });
      onUserChange(result.user);
      setNote({ tone: "ok", text: `${NAME[platform]} disconnected. Your profile link is still there.` });
    } catch (error) {
      setNote({ tone: "error", text: (error as Error).message });
    }
  }

  const verified = Boolean(user.connections.twitch || user.connections.youtube);

  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-6" aria-labelledby="channels-title">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="channels-title" className="text-xl font-bold">
          Your channels
        </h2>
        {verified && <VerifiedBadge />}
      </div>
      <p className="mt-1 text-sm text-muted">
        Link your Twitch and YouTube channels. Connect them to prove they&apos;re yours: you get a verified badge, and you can enter clips by
        link from your own channel.
      </p>
      {note && (
        <p role={note.tone === "error" ? "alert" : "status"} className={`mt-4 text-sm ${note.tone === "error" ? "text-amber-300" : "text-emerald-300"}`}>
          {note.text}
        </p>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {(["twitch", "youtube"] as const).map((platform) => (
          <ChannelRow
            // Re-mount when the saved link changes so the input shows it.
            key={`${platform}:${user.socialLinks[platform] ?? ""}`}
            platform={platform}
            user={user}
            connectAvailable={channels?.[platform].connectAvailable ?? false}
            onUserChange={onUserChange}
            onDisconnect={() => disconnect(platform)}
            onNote={setNote}
          />
        ))}
      </div>

      {channels && (channels.twitch.live || channels.youtube.channel) && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <ChannelStatsView youtube={channels.youtube.channel} live={channels.twitch.live} name={user.displayName} />
        </div>
      )}
    </section>
  );
}

function ChannelRow({
  platform,
  user,
  connectAvailable,
  onUserChange,
  onDisconnect,
  onNote,
}: {
  platform: ClipPlatform;
  user: AccountUser;
  connectAvailable: boolean;
  onUserChange: (user: AccountUser) => void;
  onDisconnect: () => void;
  onNote: (note: Note | null) => void;
}) {
  const inputId = useId();
  const current = user.socialLinks[platform] ?? "";
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  const connection = platform === "twitch" ? user.connections.twitch : user.connections.youtube;
  const connectedName = user.connections.twitch && platform === "twitch"
    ? user.connections.twitch.displayName
    : user.connections.youtube && platform === "youtube"
      ? user.connections.youtube.title
      : null;

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    onNote(null);
    try {
      const next = { ...user.socialLinks, [platform]: value.trim() || null };
      const result = await postJson<UserResult>("/api/user/me", { socialLinks: { twitch: next.twitch ?? null, youtube: next.youtube ?? null } }, "PATCH");
      onUserChange(result.user);
      onNote({ tone: "ok", text: `${NAME[platform]} link saved.` });
    } catch (error) {
      onNote({ tone: "error", text: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <p className="font-semibold">{NAME[platform]}</p>
      {connection ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="flex flex-wrap items-center gap-2 text-sm">
            <VerifiedBadge label={`Verified as ${connectedName}`} />
          </p>
          {current && (
            <a href={current} target="_blank" rel="noopener noreferrer" className="break-all text-sm text-muted underline underline-offset-2">
              {current}
            </a>
          )}
          <button type="button" onClick={onDisconnect} className="self-start text-xs text-muted underline underline-offset-2">
            Disconnect {NAME[platform]}
          </button>
        </div>
      ) : (
        <form onSubmit={save} className="mt-3 flex flex-col gap-3">
          <label htmlFor={inputId} className="sr-only">
            {NAME[platform]} profile link
          </label>
          <input
            id={inputId}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm"
            placeholder={platform === "twitch" ? "https://www.twitch.tv/yourname" : "https://www.youtube.com/@yourhandle"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={200}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={saving || value.trim() === current}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-semibold hover:border-white/40 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save link"}
            </button>
            {connectAvailable && (
              <a
                href={`/api/connect/${platform}`}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white ${platform === "twitch" ? "bg-[#9146ff] hover:bg-[#772ce8]" : "bg-[#cc0000] hover:bg-[#a80000]"}`}
              >
                Connect {NAME[platform]}
              </a>
            )}
          </div>
          {connectAvailable && (
            <p className="text-xs text-muted">
              Connecting signs you in to {NAME[platform]} once to confirm the channel is yours. We only keep the channel name.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
