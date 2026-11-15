"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";
import ClipPlayer from "@/components/clips/ClipPlayer";
import { PlatformBadge, VerifiedBadge } from "@/components/creator/CreatorBadges";
import ExternalPlayer from "@/components/creator/ExternalPlayer";
import { formatBytes, type ClipStatus } from "@/lib/clip-rules";
import type { ModerationAction, ModeratorClip } from "@/lib/clip-types";

type Session = { isAuthenticated: boolean; isModerator: boolean };
type Queue = {
  clips: ModeratorClip[];
  counts: Record<ClipStatus, number>;
  aiModerationAvailable: boolean;
};
type ApiErrorBody = { error?: { message?: string } };

const TABS: { status: ClipStatus; label: string }[] = [
  { status: "pending_review", label: "Pending review" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
  { status: "processing", label: "Uploading" },
];

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
  return body.error?.message ?? fallback;
}

export default function ModerationDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/clips/session", { cache: "no-store" });
        const data = (await res.json()) as Session;
        if (!cancelled) setSession(data);
      } catch {
        if (!cancelled) setSessionError("Could not reach the server.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (sessionError) return <p role="alert">{sessionError}</p>;
  if (!session) return <p className="opacity-60">Loading…</p>;
  if (!session.isModerator) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-5 text-sm">
        <p className="font-semibold">
          {session.isAuthenticated
            ? "This account does not have moderator access."
            : "Sign in with a moderator account to review clips."}
        </p>
        <Link href="/account" className="mt-3 inline-flex rounded-lg bg-amber-400 px-4 py-2 font-semibold text-black">
          {session.isAuthenticated ? "Open account" : "Sign in"}
        </Link>
      </div>
    );
  }
  return <ReviewQueue onSignedOut={() => setSession({ isAuthenticated: false, isModerator: false })} />;
}

function ReviewQueue({ onSignedOut }: { onSignedOut: () => void }) {
  const [status, setStatus] = useState<ClipStatus>("pending_review");
  const [queue, setQueue] = useState<Queue | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/clips?status=${status}`, { cache: "no-store" });
        if (res.status === 401) {
          if (!cancelled) onSignedOut();
          return;
        }
        if (!res.ok) throw new Error(await errorMessage(res, "Could not load the queue."));
        const data = (await res.json()) as Queue;
        if (!cancelled) {
          setQueue(data);
          setLoadError(null);
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Could not load the queue.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, reloadToken, onSignedOut]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    onSignedOut();
  }

  async function cleanup() {
    const res = await fetch("/api/admin/clips/cleanup", { method: "POST" }).catch(() => null);
    if (!res || !res.ok) {
      setNotice(res ? await errorMessage(res, "Cleanup failed.") : "Cleanup failed.");
      return;
    }
    const { removed } = (await res.json()) as { removed: number };
    setNotice(`Removed ${removed} abandoned ${removed === 1 ? "upload" : "uploads"}.`);
    reload();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Clip status">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            type="button"
            role="tab"
            aria-selected={status === tab.status}
            onClick={() => {
              setStatus(tab.status);
              setNotice(null);
            }}
            className={`rounded-full px-4 py-1.5 text-sm ${
              status === tab.status ? "bg-amber-400 font-semibold text-black" : "border border-current/20"
            }`}
          >
            {tab.label}
            {queue && <span className="ml-1.5 tabular-nums opacity-70">{queue.counts[tab.status]}</span>}
          </button>
        ))}
        <div className="ml-auto flex gap-2 text-sm">
          <button type="button" onClick={cleanup} className="rounded-lg border border-current/20 px-3 py-1.5">
            Clean up abandoned uploads
          </button>
          <button type="button" onClick={signOut} className="rounded-lg border border-current/20 px-3 py-1.5">
            Sign out
          </button>
        </div>
      </div>

      {notice && (
        <p role="status" className="rounded-lg border border-current/20 px-4 py-2 text-sm">
          {notice}
        </p>
      )}
      {loadError && (
        <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm">
          {loadError}
        </p>
      )}

      {!queue ? (
        <p className="opacity-60">Loading queue…</p>
      ) : queue.clips.length === 0 ? (
        <p className="rounded-xl border border-dashed border-current/30 p-10 text-center opacity-70">
          Nothing here.
        </p>
      ) : (
        <ul className="flex flex-col gap-6">
          {queue.clips.map((clip) => (
            <li key={clip.id}>
              <ReviewCard
                clip={clip}
                aiAvailable={queue.aiModerationAvailable}
                onChanged={(message) => {
                  setNotice(message);
                  reload();
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const VERDICT_STYLE = {
  approve: "border-emerald-500/40 bg-emerald-500/10",
  review: "border-amber-500/40 bg-amber-500/10",
  reject: "border-red-500/40 bg-red-500/10",
} as const;

function ReviewCard({
  clip,
  aiAvailable,
  onChanged,
}: {
  clip: ModeratorClip;
  aiAvailable: boolean;
  onChanged: (message: string) => void;
}) {
  const reasonId = useId();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<null | ModerationAction | "ai" | "dna" | "delete">(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [ai, setAi] = useState({ result: clip.aiModeration, error: clip.aiModerationError });
  const [dna, setDna] = useState({ result: clip.fazeDna, error: clip.fazeDnaError });

  async function act(action: ModerationAction) {
    if (action === "reject" && !reason.trim()) {
      setError("Add a short reason before rejecting.");
      return;
    }
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/clips/${clip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason.trim() || undefined }),
      });
      if (!res.ok) {
        setError(await errorMessage(res, "That action failed."));
        return;
      }
      const verb = action === "approve" ? "approved — it is now public and vote-eligible" : action === "reject" ? "rejected" : "reopened for review";
      onChanged(`“${clip.title}” ${verb}.`);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  async function runAi() {
    setBusy("ai");
    setError(null);
    try {
      const res = await fetch(`/api/admin/clips/${clip.id}/ai-review`, { method: "POST" });
      if (!res.ok) {
        const message = await errorMessage(res, "AI review failed.");
        setAi((prev) => ({ ...prev, error: message }));
        return;
      }
      const { clip: updated } = (await res.json()) as { clip: ModeratorClip };
      setAi({ result: updated.aiModeration, error: updated.aiModerationError });
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/clips/${clip.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError(await errorMessage(res, "Delete failed."));
        return;
      }
      onChanged(`“${clip.title}” deleted.`);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
      setConfirmDelete(false);
    }
  }

  async function runDna() {
    setBusy("dna");
    setError(null);
    try {
      const res = await fetch(`/api/admin/clips/${clip.id}/faze-dna`, { method: "POST" });
      if (!res.ok) {
        const message = await errorMessage(res, "FaZe DNA analysis failed.");
        setDna((previous) => ({ ...previous, error: message }));
        return;
      }
      const { clip: updated } = (await res.json()) as { clip: ModeratorClip };
      setDna({ result: updated.fazeDna, error: updated.fazeDnaError });
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(null);
    }
  }

  const canPlay = clip.status !== "processing";

  return (
    <article className="grid gap-5 rounded-xl border border-current/15 p-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        {canPlay && clip.source ? (
          <ExternalPlayer kind="clip" platform={clip.source.platform} id={clip.source.id} title={clip.title} />
        ) : canPlay ? (
          <ClipPlayer src={clip.videoUrl} poster={clip.thumbnailUrl} title={clip.title} />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl bg-black/10 text-sm opacity-70 dark:bg-white/10">
            Upload not finished
          </div>
        )}
        {canPlay && clip.thumbnail && (
          <div className="flex items-center gap-3 text-xs opacity-80">
            {/* eslint-disable-next-line @next/next/no-img-element -- access-checked redirect to a signed URL */}
            <img src={clip.thumbnailUrl} alt="Custom thumbnail" className="h-14 w-24 rounded object-cover" />
            <span>
              Thumbnail · {clip.thumbnail.contentType} · {formatBytes(clip.thumbnail.size)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 text-sm">
        <div>
          <h2 className="text-lg font-semibold">{clip.title}</h2>
          {clip.description && <p className="mt-1 whitespace-pre-line opacity-80">{clip.description}</p>}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs opacity-80">
          <dt>Status</dt>
          <dd>{clip.status.replace("_", " ")}</dd>
          <dt>Uploader</dt>
          <dd className="break-all">{clip.uploaderId}</dd>
          <dt>Submitted</dt>
          <dd>{new Date(clip.createdAt).toLocaleString()}</dd>
          <dt>Video</dt>
          {clip.source ? (
            <dd className="flex flex-wrap items-center gap-1.5">
              <PlatformBadge platform={clip.source.platform} />
              <a href={clip.source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {clip.source.channelName}&apos;s channel
              </a>
              {clip.durationSeconds ? ` · ${Math.round(clip.durationSeconds)} s` : ""}
              {clip.source.verifiedOwner ? (
                <VerifiedBadge label="Submitter owns this channel" />
              ) : (
                <span className="text-amber-300">· not from the submitter&apos;s verified channel</span>
              )}
            </dd>
          ) : (
            <dd>
              {clip.video ? `${clip.video.contentType} · ${formatBytes(clip.video.size)}` : "—"}
              {clip.durationSeconds ? ` · ${Math.round(clip.durationSeconds)} s` : ""}
            </dd>
          )}
          {clip.challengeId && (
            <>
              <dt>Challenge</dt>
              <dd>{clip.challengeId}</dd>
            </>
          )}
          {clip.rejectionReason && (
            <>
              <dt>Reason</dt>
              <dd>{clip.rejectionReason}</dd>
            </>
          )}
        </dl>

        {(aiAvailable || ai.result || ai.error) && canPlay && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide opacity-70">AI safety check</h3>
            {ai.result && (
              <div className={`rounded-lg border p-3 ${VERDICT_STYLE[ai.result.verdict]}`}>
                <p className="font-semibold">
                  Suggests: {ai.result.verdict} · {Math.round(ai.result.confidence * 100)}% confident
                </p>
                <p className="mt-1">{ai.result.summary}</p>
                <p className="mt-1 text-xs opacity-70">
                  {ai.result.categories.filter((c) => c !== "none").join(", ") || "no rule categories"} · checked{" "}
                  {ai.result.inputs.join(" + ")} · {ai.result.model}
                </p>
              </div>
            )}
            {ai.error && <p className="text-xs text-red-600 dark:text-red-400">AI review error: {ai.error}</p>}
            {aiAvailable && (
              <button
                type="button"
                onClick={runAi}
                disabled={busy !== null}
                className="self-start rounded-lg border border-current/20 px-3 py-1.5 disabled:opacity-50"
              >
                {busy === "ai" ? "Asking Gemini…" : ai.result ? "Re-run AI review" : "Run AI review"}
              </button>
            )}
          </section>
        )}

        {clip.status === "approved" && clip.remixMissionId && (
          <section className="flex flex-col gap-2 rounded-lg border border-red-500/25 bg-red-500/5 p-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-red-500">FaZe DNA coaching</h3>
            {dna.result && (
              <div>
                <p className="font-black text-[#c8ff3d]">Overall {dna.result.overallScore}/100</p>
                <p className="mt-1 text-xs opacity-75">{dna.result.reaction}</p>
              </div>
            )}
            {dna.error && <p className="text-xs text-red-600 dark:text-red-400">Analysis error: {dna.error}</p>}
            <button
              type="button"
              onClick={runDna}
              disabled={busy !== null}
              className="self-start rounded-lg border border-current/20 px-3 py-1.5 disabled:opacity-50"
            >
              {busy === "dna" ? "Analyzing complete clip…" : dna.result ? "Re-run FaZe DNA" : "Generate FaZe DNA"}
            </button>
          </section>
        )}

        {clip.status !== "processing" && clip.status !== "rejected" && (
          <div>
            <label htmlFor={reasonId} className="mb-1 block text-xs font-semibold">
              {clip.status === "approved" ? "Takedown reason" : "Rejection reason"}
            </label>
            <input
              id={reasonId}
              value={reason}
              maxLength={500}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Required to reject"
              className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-1.5"
            />
          </div>
        )}

        {error && (
          <p role="alert" className="text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-2">
          {clip.status === "pending_review" && (
            <button
              type="button"
              onClick={() => act("approve")}
              disabled={busy !== null}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {busy === "approve" ? "Approving…" : "Approve"}
            </button>
          )}
          {(clip.status === "pending_review" || clip.status === "approved") && (
            <button
              type="button"
              onClick={() => act("reject")}
              disabled={busy !== null}
              className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
            >
              {busy === "reject" ? "Rejecting…" : clip.status === "approved" ? "Take down" : "Reject"}
            </button>
          )}
          {clip.status === "rejected" && (
            <button
              type="button"
              onClick={() => act("reopen")}
              disabled={busy !== null}
              className="rounded-lg border border-current/30 px-4 py-2 disabled:opacity-50"
            >
              {busy === "reopen" ? "Reopening…" : "Reopen for review"}
            </button>
          )}
          {clip.status === "approved" && (
            <Link href={`/clips/${clip.id}`} className="rounded-lg border border-current/30 px-4 py-2">
              View public page
            </Link>
          )}
          {confirmDelete ? (
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={remove}
                disabled={busy !== null}
                className="rounded-lg bg-red-700 px-3 py-2 text-white disabled:opacity-50"
              >
                {busy === "delete" ? "Deleting…" : "Confirm delete"}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-2 opacity-70">
                Cancel
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={busy !== null}
              className="rounded-lg px-3 py-2 text-red-600 disabled:opacity-50 dark:text-red-400"
            >
              Delete…
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
