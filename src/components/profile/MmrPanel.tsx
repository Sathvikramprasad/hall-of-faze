"use client";
import { useEffect, useState } from "react";
import { ROMAN, TIER_COLORS, TIER_SPAN, type Tier } from "@/lib/mmr-rules";
type Data = { rating: { tier: Tier; points: number; demotionShield: boolean }; badges: { challengeId: string; title: string; sponsor: string; color: string; icon: string }[]; wins: number; challengesPlayed: number };
export default function MmrPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { fetch("/api/user/mmr", { cache: "no-store" }).then(r => { if (!r.ok) throw Error(); return r.json(); }).then(body => setData(body.data)).catch(() => setError(true)); }, []);
  if (error) return <p className="text-sm text-muted">Ranking is temporarily unavailable.</p>;
  if (!data) return <p className="text-sm text-muted">Loading ranking…</p>;
  const { rating, badges } = data;
  const color = TIER_COLORS[rating.tier];
  return <section className="rounded-2xl border border-white/10 bg-surface p-6" aria-label="FaZe competitive rank">
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-3" style={{ color }}>
        <img src="/brand/faze-logo-onecolor-white.png" alt="FaZe rank emblem" className="h-12 w-12 object-contain" style={{ backgroundColor: color, borderRadius: 8, padding: 5 }} />
        <div><p className="text-xs font-bold uppercase tracking-widest text-muted">Competitive Rank</p><p className="text-2xl font-black">Tier {ROMAN[rating.tier]}</p></div>
      </div>
      <details className="relative group text-sm">
        <summary aria-label="How ranking works" className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full border border-white/30 font-bold" title="How ranking works">?</summary>
        <div className="absolute left-0 top-9 z-20 w-72 max-w-[85vw] rounded-xl border border-white/20 bg-zinc-950 p-4 text-sm leading-6 text-white shadow-xl">
          Win challenges to rise through the five tiers. Second and third place also earn substantial progress, while other high-ranking entries and votes can help. Finishing below the top ten percent may cost points, except top-ten finishers are protected. Lower finishes generally cost more. When you first reach the bottom of your tier, you receive one final chance before demotion. Extended inactivity gradually reduces your rank. Each challenge win earns a sponsor-themed badge. Rankings use verified community votes, not AI scores.
        </div>
      </details>
    </div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${rating.points / TIER_SPAN * 100}%`, backgroundColor: color }} /></div>
    <p className="mt-2 text-xs text-muted">{rating.tier === 1 ? "Top division" : "Progress toward next tier"}{rating.demotionShield ? " · Demotion warning: next loss may demote you" : ""}</p>
    <p className="mt-3 text-sm text-muted">{data.wins} challenge wins · {data.challengesPlayed} challenges ranked</p>
    {badges.length > 0 && <div className="mt-5"><h3 className="mb-3 text-sm font-bold">Challenge Champion Badges</h3><div className="flex flex-wrap gap-3">{badges.map((badge, i) => <div key={badge.challengeId + i} className="rounded-xl border border-white/15 px-4 py-3" title={badge.title}><span className="mr-2 text-xl" style={{ color: badge.color }}>{badge.icon}</span><span className="text-sm font-semibold">{badge.sponsor} Champion</span></div>)}</div></div>}
  </section>;
}
