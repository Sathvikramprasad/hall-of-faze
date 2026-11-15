"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
export default function MmrAdmin() {
  const [challengeId, setChallengeId] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const action = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/mmr/${action === "badge" ? "badge" : "settle"}`, {
        method: action === "badge" ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, artworkUrl }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Request failed.");
      setMessage(action === "badge" ? "Sponsor artwork saved." : `${body.data.alreadySettled ? "Already settled" : "Settlement complete"}: ${body.data.settled} players ranked.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-xl px-5 py-12"><Link href="/account">← My profile</Link><h1 className="my-6 text-3xl font-black">Challenge rankings</h1><p className="mb-6 text-sm text-muted">Moderators can save sponsor-designed badge artwork before settling a challenge. Settlement is final and only available after voting closes.</p><form onSubmit={submit} className="flex flex-col gap-4"><label>Challenge ID<input required pattern="[a-fA-F0-9]{24}" value={challengeId} onChange={e => setChallengeId(e.target.value)} className="mt-2 block w-full rounded border border-white/20 p-3" /></label><label>Sponsor badge artwork URL<input type="url" value={artworkUrl} onChange={e => setArtworkUrl(e.target.value)} placeholder="https://…" className="mt-2 block w-full rounded border border-white/20 p-3" /></label><button value="badge" disabled={busy || !artworkUrl} className="rounded border border-white/20 p-3 disabled:opacity-50">Save badge artwork</button><button value="settle" disabled={busy} className="rounded bg-accent-fill p-3 disabled:opacity-50">Settle final rankings</button><p role="status">{message}</p></form></main>;
}
