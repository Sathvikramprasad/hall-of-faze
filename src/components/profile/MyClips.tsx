"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { call } from "@/components/profile/api";
import type { ProfileClip } from "@/lib/profile-clips";

const STATUS_LABEL: Record<ProfileClip["status"], { text: string; className: string }> = {
  processing: { text: "Uploading", className: "bg-white/10 text-muted" },
  pending_review: { text: "In review", className: "bg-amber-400/15 text-amber-300" },
  approved: { text: "Approved", className: "bg-emerald-400/15 text-emerald-300" },
  rejected: { text: "Rejected", className: "bg-red-500/15 text-red-300" },
};

/** Every clip the user submitted, with its challenge (linked until it ends) and a delete button. */
export default function MyClips() {
  const [clips, setClips] = useState<ProfileClip[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    call<{ clips: ProfileClip[] }>("/api/user/clips")
      .then((data) => { if (!cancelled) setClips(data.clips); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  async function remove(id: string) {
    setDeleting(id);
    setError(null);
    try {
      await call(`/api/clips/${id}`, { method: "DELETE" });
      setClips((list) => list?.filter((clip) => clip.id !== id) ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(null);
      setConfirming(null);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-surface p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">My clips</h2>
          <p className="mt-1 text-sm text-muted">{clips ? `${clips.length} submitted` : "Everything you've submitted"}</p>
        </div>
        <Link href="/upload" className="rounded-lg bg-accent-fill px-4 py-2 text-sm font-semibold text-white">Upload a clip</Link>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-amber-300">{error}</p>}
      {!clips && !error && <p className="mt-6 text-sm text-muted">Loading your clips…</p>}
      {clips?.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-muted">
          You haven&apos;t submitted any clips yet. Pick a challenge and upload your best play.
        </p>
      )}

      {clips && clips.length > 0 && (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clips.map((clip) => {
            const status = STATUS_LABEL[clip.status];
            const preview = (
              // eslint-disable-next-line @next/next/no-img-element -- access-checked redirect to signed storage
              <img src={clip.thumbnailUrl} alt="" loading="lazy" className="aspect-video w-full bg-black/40 object-cover" />
            );
            return (
              <li key={clip.id} className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/20">
                {clip.status === "approved" ? <Link href={`/clips/${clip.id}`} aria-label={`Watch ${clip.title}`}>{preview}</Link> : preview}
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 break-words font-semibold leading-snug">{clip.title}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>{status.text}</span>
                  </div>
                  {clip.challenge ? (
                    clip.challenge.open ? (
                      <Link href={`/next-up/${clip.challenge.slug}`} className="text-sm text-red-400 hover:text-red-300 hover:underline">
                        {clip.challenge.title} →
                      </Link>
                    ) : (
                      <p className="text-sm text-muted">
                        {clip.challenge.title} <span className="ml-1 rounded bg-white/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide">Ended</span>
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-muted">No challenge</p>
                  )}
                  {clip.status === "rejected" && clip.rejectionReason && <p className="text-xs text-red-300">Reason: {clip.rejectionReason}</p>}
                  <p className="mt-auto pt-2 text-xs text-muted">
                    {clip.status === "approved" ? `${clip.voteCount} vote${clip.voteCount === 1 ? "" : "s"} · ` : ""}
                    {new Date(clip.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {confirming === clip.id ? (
                    <div className="mt-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm">
                      <p>Delete this clip{clip.status === "approved" ? " and its votes" : ""}? This can&apos;t be undone.</p>
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => remove(clip.id)} disabled={deleting === clip.id} className="rounded-md bg-red-600 px-3 py-1 font-semibold text-white disabled:opacity-50">
                          {deleting === clip.id ? "Deleting…" : "Delete"}
                        </button>
                        <button type="button" onClick={() => setConfirming(null)} disabled={deleting === clip.id} className="rounded-md border border-white/20 px-3 py-1">Keep</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirming(clip.id)} className="mt-2 self-start text-sm font-semibold text-red-400 hover:text-red-300">
                      Delete clip
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
