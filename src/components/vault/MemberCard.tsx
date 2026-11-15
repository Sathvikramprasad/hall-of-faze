import Link from "next/link";
import type { MemberProfile } from "@/lib/vault/types";

export function MemberCard({ member }: { member: MemberProfile }) {
  return (
    <li>
      <Link
        href={`/vault/members/${member.slug}`}
        className="group block h-full rounded-xl border border-white/10 bg-surface p-5 transition-colors hover:border-accent"
      >
        <p className="text-lg font-bold group-hover:text-accent">{member.handle}</p>
        {member.realName && <p className="text-sm text-muted">{member.realName}</p>}
        <p className="mt-2 text-sm">{member.role}</p>
        {member.era && <p className="mt-1 font-mono text-xs text-muted">{member.era}</p>}
      </Link>
    </li>
  );
}
