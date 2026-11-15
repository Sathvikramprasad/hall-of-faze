import { ROMAN, TIER_COLORS, TIER_SPAN } from "@/lib/mmr-rules";
import type { PlayerMmr } from "@/lib/mmr-server";

export default function MmrRank({ data }: { data: PlayerMmr }) {
  const { rating, badges } = data;
  const color = TIER_COLORS[rating.tier];
  return <section className="rounded-2xl border border-white/10 bg-surface p-6" aria-label="FaZe competitive rank">
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-3" style={{ color }}>
        <span role="img" aria-label={`FaZe Tier ${ROMAN[rating.tier]} emblem`} className="block h-12 w-12" style={{ backgroundColor: color, maskImage: "url(/brand/faze-logo-onecolor-white.png)", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center" }} />
        <div><p className="text-xs font-bold uppercase tracking-widest text-muted">Competitive Rank</p><p className="text-2xl font-black">Tier {ROMAN[rating.tier]}</p></div>
      </div>
      <details className="mmr-help relative text-sm">
        <summary aria-label="How ranking works" className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-full border border-white/30 font-bold">?</summary>
        <div className="mmr-help-content absolute right-0 top-7 z-20 w-72 max-w-[85vw] rounded-xl border border-white/20 bg-zinc-950 p-4 text-sm leading-6 text-white shadow-xl">
          A challenge win advances you a tier. Repeated second or third places earn promotion too. Other high finishes and community votes build progress. Finish outside the top ten percent and you lose points, unless you place in the top ten. Lower finishes cost more; votes soften the loss. At the bottom of your tier you get a warning and one chance to recover; another loss demotes you. Extended inactivity gradually reduces your rank. Your best eligible clip counts once per challenge, with ties decided by earlier approval, then clip ID. Every win earns a champion badge featuring the sponsor’s artwork when supplied. Ranks use community votes, never AI coaching scores.
        </div>
      </details>
    </div>
    <div role="progressbar" aria-label="Tier progress" aria-valuemin={0} aria-valuemax={TIER_SPAN} aria-valuenow={rating.points} className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${rating.points / TIER_SPAN * 100}%`, backgroundColor: color }} /></div>
    <p className="mt-2 text-xs text-muted">{rating.tier === 1 ? "Top division" : "Progress toward next tier"}{rating.demotionShield ? " · Demotion warning: next loss demotes you" : ""}</p>
    <p className="mt-3 text-sm text-muted">{data.wins} challenge wins · {data.challengesPlayed} challenges ranked</p>
    {badges.length > 0 && <div className="mt-5"><h3 className="mb-3 text-sm font-bold">Challenge Champion Badges</h3><div className="flex flex-wrap gap-3">{badges.map((badge) => <div key={badge.challengeId + badge.awardedAt} className="flex items-center gap-3 rounded-xl border border-white/15 px-4 py-3" title={badge.title}>
      {badge.artworkUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- sponsor-hosted artwork; no image optimization needed
        <img src={badge.artworkUrl} alt={`${badge.sponsor} champion badge`} width={48} height={48} referrerPolicy="no-referrer" className="h-12 w-12 object-contain" />
      ) : <span className="text-xl" style={{ color: badge.color }} aria-hidden="true">{badge.icon}</span>}
      <div><p className="text-sm font-semibold">{badge.sponsor} Champion</p><p className="text-xs text-muted">{badge.title}</p></div>
    </div>)}</div></div>}
  </section>;
}
