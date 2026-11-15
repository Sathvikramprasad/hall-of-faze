import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { getPlayerMmr } from "@/lib/mmr-server";
import MmrRank from "@/components/profile/MmrRank";
import Avatar from "@/components/profile/Avatar";

async function Player({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id)) notFound();
  await connectDB();
  const user = await User.findById(id).select("displayName avatarKey avatarVersion").lean().exec();
  if (!user) notFound();
  const data = await getPlayerMmr(id);
  return <><header className="mb-6 flex items-center gap-4"><Avatar name={user.displayName} seed={id} url={user.avatarKey ? `/api/users/${id}/avatar?v=${user.avatarVersion ?? 0}` : null} /><h1 className="text-3xl font-black">{user.displayName}</h1></header><MmrRank data={data} /></>;
}
export default function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  return <main className="mx-auto max-w-4xl px-5 py-12"><Link href="/next-up" className="mb-6 block text-sm text-muted">← Challenges</Link><Suspense fallback={<p>Loading player…</p>}><Player params={params} /></Suspense></main>;
}
