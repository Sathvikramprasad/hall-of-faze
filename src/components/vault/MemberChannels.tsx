import { connection } from "next/server";
import ChannelStatsView from "@/components/creator/ChannelStatsView";
import { getChannelStats, memberChannelRefs } from "@/lib/creator-data";
import type { MemberProfile } from "@/lib/vault/types";

/** A Vault member's live Twitch status and current YouTube stats. Renders nothing if neither is available. */
export async function MemberChannels({ member }: { member: MemberProfile }) {
  await connection();
  const stats = await getChannelStats(memberChannelRefs(member));
  if (!stats.youtube && !stats.live) return null;
  return (
    <section aria-labelledby="channels-heading" className="mt-12">
      <h2 id="channels-heading" className="font-display text-3xl uppercase tracking-wide">
        Their channels today
      </h2>
      <div className="mt-6">
        <ChannelStatsView youtube={stats.youtube} live={stats.live} name={member.handle} />
      </div>
    </section>
  );
}

export function MemberChannelsSkeleton() {
  return <div className="mt-12 h-48 animate-pulse rounded-xl bg-white/5" aria-label="Loading channel stats" />;
}
