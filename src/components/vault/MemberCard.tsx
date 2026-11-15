import Image from "next/image";
import Link from "next/link";
import { getChannelLinks } from "@/lib/vault/channels";
import type { MemberProfile } from "@/lib/vault/types";
import { CHANNEL_BUTTON_COLORS } from "./channel-colors";

function MemberAvatar({ member }: { member: MemberProfile }) {
  if (member.photo) {
    return <Image src={member.photo} alt="" width={64} height={64} className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-accent-fill" />;
  }
  return (
    <span aria-hidden="true" className="faze-camo flex h-16 w-16 shrink-0 items-center justify-center rounded-full ring-2 ring-accent-fill">
      <span className="font-display text-3xl text-white [text-shadow:0_2px_6px_#000]">
        {member.handle.replace(/^FaZe\s+/i, "").charAt(0).toUpperCase()}
      </span>
    </span>
  );
}

/**
 * A member tile on the Vault page. It grows slightly on hover, and after
 * hovering for a moment it opens into a larger card with their photo, a short
 * bio, the games they play and links to their YouTube and Twitch channels.
 * Keyboard and touch users get the same details on the member's profile page.
 */
export function MemberCard({ member }: { member: MemberProfile }) {
  const links = getChannelLinks(member);
  const profileHref = `/vault/members/${member.slug}`;

  return (
    <li className="group/member relative">
      <Link
        href={profileHref}
        // Grows slightly on hover and keyboard focus; stays still for people who reduce motion.
        className="group block h-full rounded-xl border border-white/10 bg-surface p-5 transition-[border-color,scale,box-shadow] duration-200 ease-out hover:scale-[1.04] hover:border-accent hover:shadow-xl hover:shadow-accent-fill/15 focus-visible:scale-[1.04] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100"
      >
        <p className="text-lg font-bold group-hover:text-accent">{member.handle}</p>
        {member.realName && <p className="text-sm text-muted">{member.realName}</p>}
        <p className="mt-2 text-sm">{member.role}</p>
        {member.era && <p className="mt-1 font-mono text-xs text-muted">{member.era}</p>}
      </Link>

      {/* Expanded card: opens over the tile after 1.5 s of hovering, closes as soon as the pointer leaves. */}
      <div className="invisible absolute -inset-x-3 -top-3 z-20 hidden origin-top scale-95 rounded-2xl border border-accent bg-surface p-5 opacity-0 shadow-2xl shadow-black/70 transition-[opacity,scale,visibility] duration-200 ease-out group-hover/member:visible group-hover/member:scale-100 group-hover/member:opacity-100 group-hover/member:delay-[1500ms] motion-reduce:scale-100 motion-reduce:transition-none sm:block">
        <div className="flex items-center gap-4">
          <MemberAvatar member={member} />
          <div className="min-w-0">
            <Link href={profileHref} tabIndex={-1} className="text-lg font-bold text-accent hover:underline">
              {member.handle}
            </Link>
            {member.realName && <p className="text-sm text-muted">{member.realName}</p>}
            <p className="font-mono text-xs text-muted">
              {member.role}
              {member.era ? ` · ${member.era}` : ""}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6">{member.bio}</p>
        <div className="mt-4">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-muted">Games</p>
          {member.games?.length ? (
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {member.games.map((game) => (
                <li key={game} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs font-semibold">
                  {game}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-muted">None listed</p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {links.map((link) => (
            <a
              key={link.platform}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition-colors ${CHANNEL_BUTTON_COLORS[link.platform]}`}
            >
              {link.platform}
            </a>
          ))}
          {links.length === 0 && <span className="text-xs text-muted">No channels listed</span>}
          <Link href={profileHref} tabIndex={-1} className="ml-auto text-sm font-semibold text-accent underline underline-offset-4">
            Full profile &rarr;
          </Link>
        </div>
      </div>
    </li>
  );
}
