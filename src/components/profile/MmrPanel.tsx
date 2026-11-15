"use client";
import { useEffect, useState } from "react";
import MmrRank from "@/components/profile/MmrRank";
import type { PlayerMmr } from "@/lib/mmr-server";
export default function MmrPanel() {
  const [data, setData] = useState<PlayerMmr | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/user/mmr", { cache: "no-store", signal: controller.signal })
      .then(r => { if (!r.ok) throw Error(); return r.json(); })
      .then(body => setData(body.data)).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, []);
  if (error) return <p className="text-sm text-muted">Ranking is temporarily unavailable.</p>;
  if (!data) return <p className="text-sm text-muted">Loading ranking…</p>;
  return <MmrRank data={data} />;
}
