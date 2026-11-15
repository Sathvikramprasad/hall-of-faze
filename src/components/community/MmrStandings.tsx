"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Standings = { settled: boolean; total: number; pages: number; entries: { userId: string; displayName: string; place: number; votes: number; delta: number }[] };
export default function MmrStandings({ challengeId }: { challengeId: string }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Standings | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/challenges/${challengeId}/standings?page=${page}`, { signal: controller.signal, cache: "no-store" })
      .then(r => { if (!r.ok) throw Error(); return r.json(); }).then(body => { setData(body.data); setError(false); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [challengeId, page]);
  return <section className="border-t border-zinc-800 py-8"><h2 className="text-2xl font-black">Final player standings</h2>
    {error ? <p role="status">Unable to load standings.</p> : !data ? <p>Loading standings…</p> : !data.settled ? <p className="mt-3 text-zinc-400">Final rankings will appear after moderator settlement.</p> : <>
      <p className="my-3 text-sm text-zinc-400">{data.total} players · Each player’s best eligible clip counts once.</p>
      <table className="w-full text-left text-sm"><thead><tr><th>Place</th><th>Player</th><th>Votes</th><th>Points</th></tr></thead><tbody>{data.entries.map(entry => <tr key={entry.userId} className="border-t border-white/10"><td className="py-3">{entry.place}</td><td><Link className="text-red-400" href={`/players/${entry.userId}`}>{entry.displayName}</Link></td><td>{entry.votes}</td><td>{entry.delta > 0 ? "+" : ""}{entry.delta}</td></tr>)}</tbody></table>
      {data.pages > 1 && <nav aria-label="Standings pages" className="mt-4 flex items-center gap-4"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="disabled:opacity-40">Previous</button><span>Page {page} of {data.pages}</span><button disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="disabled:opacity-40">Next</button></nav>}
    </>}
  </section>;
}
