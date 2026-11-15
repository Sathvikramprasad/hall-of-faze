import type { Metadata } from "next";
import { Suspense } from "react";
import {
  LivePulseDashboard,
  LivePulseDashboardSkeleton,
} from "@/components/live/LivePulsePanel";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Live Pulse · Hall of FaZe",
  description: "Live FaZe Twitch streams, top Twitch clips, and the newest official FaZe YouTube uploads.",
};

export default function LivePulsePage() {
  return (
    <PageShell>
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(145,70,255,0.2),transparent_30%),radial-gradient(circle_at_top_left,rgba(228,0,43,0.18),transparent_35%)]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="font-mono text-sm font-bold uppercase tracking-[0.28em] text-accent">Always on</p>
          <h1 className="mt-3 font-display text-6xl uppercase leading-none tracking-wide sm:text-8xl">
            FaZe Live <span className="text-accent-fill">Pulse</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-muted sm:text-xl">
            The Vault preserves the moments that made FaZe. Live Pulse shows what the clan and its creators are doing now—across Twitch and YouTube.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <Suspense fallback={<LivePulseDashboardSkeleton />}>
          <LivePulseDashboard />
        </Suspense>
      </div>
    </PageShell>
  );
}
