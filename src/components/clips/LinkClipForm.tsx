"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { PlatformBadge, VerifiedBadge } from "@/components/creator/CreatorBadges";
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH, type ValidationIssue } from "@/lib/clip-rules";
import type { LinkPreviewResponse, OwnerClip } from "@/lib/clip-types";
import { formatClipLength, parseClipLink } from "@/lib/creator-links";

type ApiErrorBody = { error?: { code?: string; message?: string; details?: ValidationIssue[] } };
type Lookup =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ok"; data: LinkPreviewResponse };

const NOT_A_CLIP_LINK = "Paste a Twitch clip link or a YouTube video or Shorts link.";

const PLATFORM_NAME = { twitch: "Twitch", youtube: "YouTube" } as const;

/** Enter a clip by pasting a Twitch clip or YouTube video / Shorts link. */
export default function LinkClipForm() {
  const ids = { url: useId(), title: useId(), description: useId() };
  const [url, setUrl] = useState("");
  /** Result of the last finished lookup, and which link it was for. */
  const [result, setResult] = useState<{ url: string; lookup: Lookup } | null>(null);
  const [title, setTitle] = useState("");
  const titleEdited = useRef(false);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<OwnerClip | null>(null);

  const trimmed = url.trim();
  const parseable = Boolean(trimmed && parseClipLink(trimmed));
  const lookup: Lookup = !trimmed
    ? { state: "idle" }
    : !parseable
      ? { state: "error", message: NOT_A_CLIP_LINK }
      : result?.url === trimmed
        ? result.lookup
        : { state: "loading" };

  // Look the link up shortly after the user stops typing or pastes it.
  useEffect(() => {
    if (!parseable) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      let next: Lookup;
      try {
        const res = await fetch(`/api/clips/link?${new URLSearchParams({ url: trimmed })}`, { signal: controller.signal });
        if (res.ok) {
          const data = (await res.json()) as LinkPreviewResponse;
          next = { state: "ok", data };
          if (!titleEdited.current) setTitle(data.preview.title.slice(0, TITLE_MAX_LENGTH));
        } else {
          const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
          next = { state: "error", message: body.error?.message ?? "Couldn't look up that link." };
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        next = { state: "error", message: "Couldn't reach the server. Try again." };
      }
      setResult({ url: trimmed, lookup: next });
    }, 450);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [trimmed, parseable]);

  const preview = lookup.state === "ok" ? lookup.data : null;
  const blocked = Boolean(preview && preview.ownChannelRequired && !preview.fromYourChannel);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !preview || blocked) return;
    setBusy(true);
    setFormError(null);
    try {
      const challengeId = new URLSearchParams(window.location.search).get("challengeId");
      const res = await fetch("/api/clips/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), title: title.trim(), description: description.trim(), challengeId: challengeId || null }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
        setFormError(body.error?.details?.[0]?.message ?? body.error?.message ?? "Couldn't enter the clip.");
        return;
      }
      setCreated(((await res.json()) as { clip: OwnerClip }).clip);
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setUrl("");
    setTitle("");
    titleEdited.current = false;
    setDescription("");
    setFormError(null);
    setCreated(null);
  }

  if (created) {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-6" role="status">
        <h2 className="text-xl font-semibold">Clip submitted for review</h2>
        <p className="mt-2 text-sm opacity-80">
          It stays private until a moderator approves it. Once approved it appears in the public feed and can receive votes.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/clips/${created.id}`} className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black">
            Preview my clip
          </Link>
          <button type="button" onClick={reset} className="rounded-lg border border-current/30 px-4 py-2">
            Enter another
          </button>
        </div>
      </div>
    );
  }

  const fieldClass =
    "w-full rounded-lg border border-black/15 bg-white/70 px-3 py-2 text-black outline-none focus:border-amber-500 dark:border-white/15 dark:bg-white/5 dark:text-white";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6" aria-busy={busy}>
      {formError && (
        <div role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm">
          {formError}
        </div>
      )}

      <div>
        <label htmlFor={ids.url} className="mb-1 block font-medium">
          Twitch or YouTube link
        </label>
        <input
          id={ids.url}
          type="url"
          inputMode="url"
          className={fieldClass}
          placeholder="https://clips.twitch.tv/…  or  https://youtube.com/shorts/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={busy}
          aria-invalid={lookup.state === "error"}
          aria-describedby={`${ids.url}-hint`}
          required
        />
        <p id={`${ids.url}-hint`} className="mt-1 text-xs opacity-60">
          A Twitch clip, YouTube video or YouTube Short · up to 3 minutes · plays in Twitch&apos;s or YouTube&apos;s own player
        </p>
        <div aria-live="polite" className="mt-2 text-sm">
          {lookup.state === "loading" && <p className="opacity-70">Looking up the link…</p>}
          {lookup.state === "error" && <p className="text-red-600 dark:text-red-400">{lookup.message}</p>}
        </div>
      </div>

      {preview && (
        <div className="flex flex-col gap-3 rounded-xl border border-current/15 p-3 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element -- Twitch / YouTube image CDN */}
          <img src={preview.preview.thumbnailUrl} alt="" className="aspect-video w-full rounded-lg bg-black object-cover sm:w-56" />
          <div className="flex min-w-0 flex-col gap-1.5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <PlatformBadge platform={preview.preview.platform} />
              <span className="tabular-nums opacity-70">{formatClipLength(preview.preview.durationSeconds)}</span>
            </div>
            <p className="font-semibold">{preview.preview.title}</p>
            <p className="opacity-70">From {preview.preview.channelName}&apos;s channel</p>
            {preview.fromYourChannel && <VerifiedBadge label="From your verified channel" className="self-start" />}
            {blocked && (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                Link clips must come from your own {PLATFORM_NAME[preview.preview.platform]} channel.{" "}
                <Link href="/account" className="font-semibold underline underline-offset-2">
                  Connect {PLATFORM_NAME[preview.preview.platform]} on My Profile
                </Link>{" "}
                to enter clips from your channel.
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label htmlFor={ids.title} className="mb-1 block font-medium">
          Title
        </label>
        <input
          id={ids.title}
          className={fieldClass}
          value={title}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(e) => {
            setTitle(e.target.value);
            titleEdited.current = true;
          }}
          disabled={busy}
          placeholder="Filled in from the link"
        />
      </div>

      <div>
        <label htmlFor={ids.description} className="mb-1 block font-medium">
          Description <span className="font-normal opacity-60">(optional)</span>
        </label>
        <textarea
          id={ids.description}
          className={`${fieldClass} min-h-24`}
          value={description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          onChange={(e) => setDescription(e.target.value)}
          disabled={busy}
        />
        <p className="mt-1 text-xs opacity-60">
          {description.length}/{DESCRIPTION_MAX_LENGTH}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || !preview || blocked}
          className="rounded-lg bg-amber-400 px-5 py-2.5 font-semibold text-black disabled:opacity-50"
        >
          {busy ? "Submitting…" : "Submit clip for review"}
        </button>
        <p className="text-xs opacity-60">Clips stay private until a moderator approves them.</p>
      </div>
    </form>
  );
}
