import Link from "next/link";
import type { MemberProfile } from "@/lib/vault/types";

export function MemberCard({ member }: { member: MemberProfile }) {
  return (
    <li>
      <Link
        href={`/vault/members/${member.slug}`}
        // Grows slightly on hover and keyboard focus; stays still for people who reduce motion.
        className="group block h-full rounded-xl border border-white/10 bg-surface p-5 transition-[border-color,scale,box-shadow] duration-200 ease-out hover:scale-[1.04] hover:border-accent hover:shadow-xl hover:shadow-accent-fill/15 focus-visible:scale-[1.04] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100"
      >
        <p className="text-lg font-bold group-hover:text-accent">{member.handle}</p>
        {member.realName && <p className="text-sm text-muted">{member.realName}</p>}
        <p className="mt-2 text-sm">{member.role}</p>
        {member.era && <p className="mt-1 font-mono text-xs text-muted">{member.era}</p>}
      </Link>
    </li>
  );
}
