import type { PublicFazeDnaAnalysis } from "@/lib/clip-types";
import type { RemixMission } from "@/lib/remix";

function scoreTone(value: number): string {
  if (value >= 85) return "from-[#c8ff3d] to-emerald-400";
  if (value >= 70) return "from-red-500 to-orange-400";
  return "from-red-700 to-red-400";
}

export default function FazeDnaCard({
  analysis,
  mission,
}: {
  analysis: PublicFazeDnaAnalysis;
  mission: RemixMission;
}) {
  return (
    <section
      aria-labelledby="faze-dna-heading"
      className="overflow-hidden rounded-3xl border border-red-500/40 bg-[radial-gradient(circle_at_top_right,rgba(239,0,48,0.22),transparent_42%),#090909] text-white shadow-2xl shadow-red-950/30"
    >
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/40 p-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-red-400">Remix the Vault</p>
            <h2 id="faze-dna-heading" className="mt-2 text-3xl font-black tracking-tight">
              FaZe DNA
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">AI creative coaching inspired by the 2012 Teamtage.</p>
          </div>
          <div className="mt-8">
            <div className="flex items-end gap-2">
              <span className="font-mono text-7xl font-black leading-none text-[#c8ff3d]">
                {analysis.overallScore}
              </span>
              <span className="pb-1 font-mono text-xl text-zinc-500">/100</span>
            </div>
            <p className="mt-3 text-lg font-black text-white">“{analysis.reaction}”</p>
          </div>
        </div>

        <div>
          <div className="grid gap-4">
            {mission.rubric.map((criterion) => {
              const value = analysis.scores[criterion.key];
              return (
                <div key={criterion.key}>
                  <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                    <span className="font-bold">{criterion.label}</span>
                    <span className="font-mono font-black text-zinc-200">{value}</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`${criterion.label} score`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={value}
                    className="h-2.5 overflow-hidden rounded-full bg-white/10"
                  >
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${scoreTone(value)}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Strongest signal</p>
              <p className="mt-2 text-sm leading-6 text-zinc-200">{analysis.strength}</p>
            </div>
            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">Level-up move</p>
              <p className="mt-2 text-sm leading-6 text-zinc-200">{analysis.improvement}</p>
            </div>
          </div>
        </div>
      </div>
      <p className="border-t border-white/10 px-6 py-3 text-xs text-zinc-500 sm:px-8">
        FaZe DNA is AI-generated coaching, not an official FaZe evaluation. It never affects rank—community votes decide the winners.
      </p>
    </section>
  );
}
