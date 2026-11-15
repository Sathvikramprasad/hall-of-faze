import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MemberChannels, MemberChannelsSkeleton } from "@/components/vault/MemberChannels";
import { CHANNEL_BUTTON_COLORS } from "@/components/vault/channel-colors";
import { SourceList } from "@/components/vault/SourceList";
import { VideoEmbed } from "@/components/vault/VideoEmbed";
import {
  entryAnchor,
  formatEntryDate,
  getEntriesForMember,
  getMember,
  getMembers,
} from "@/lib/vault/queries";
import { getChannelLinks } from "@/lib/vault/channels";

// Cache Components requires at least one param here; we prerender every
// curated member. Unknown slugs fall through to notFound().
export function generateStaticParams() {
  return getMembers().map((member) => ({ slug: member.slug }));
}

export async function generateMetadata(
  props: PageProps<"/vault/members/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const member = getMember(slug);
  if (!member) return { title: "Member not found | Hall of FaZe" };
  return {
    title: `${member.handle} | The FaZe Vault`,
    description: member.bio,
  };
}

export default async function MemberPage(props: PageProps<"/vault/members/[slug]">) {
  const { slug } = await props.params;
  const member = getMember(slug);
  if (!member) notFound();

  const entries = getEntriesForMember(member.slug);
  const channelLinks = getChannelLinks(member);

  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/vault" className="text-sm text-muted underline underline-offset-4 hover:text-foreground">
          ← Back to the Vault
        </Link>

        <header className="mt-6">
          <h1 className="font-display text-5xl uppercase tracking-wide sm:text-6xl">{member.handle}</h1>
          {member.realName && <p className="mt-2 text-lg text-muted">{member.realName}</p>}
          <p className="mt-4 inline-flex flex-wrap gap-2 text-sm">
            {member.currentRoster && (
              <span className="rounded-full border border-accent/60 px-3 py-1 font-medium">
                Current · {member.currentRoster}
              </span>
            )}
            <span className="rounded-full bg-accent/15 px-3 py-1 font-medium text-accent">{member.role}</span>
            {member.era && (
              <span className="rounded-full bg-white/10 px-3 py-1 font-mono">{member.era}</span>
            )}
          </p>
        </header>

        {member.games?.length ? (
          <p className="mt-4 text-sm">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">Games</span>{" "}
            {member.games.join(" · ")}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-muted">Channels</h2>
          {channelLinks.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {channelLinks.map((link) => (
                <li key={link.platform}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 font-bold text-white transition-colors ${CHANNEL_BUTTON_COLORS[link.platform]}`}
                  >
                    {link.platform}
                    {link.name && <span className="font-normal text-white/90">{link.name}</span>}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted">No YouTube or Twitch channels listed.</p>
          )}
        </div>

        <p className="mt-8 text-lg leading-8">{member.bio}</p>
        <SourceList sources={member.sources} className="mt-4" />

        {member.channels && (
          <Suspense fallback={<MemberChannelsSkeleton />}>
            <MemberChannels member={member} />
          </Suspense>
        )}

        <section aria-labelledby="videos-heading" className="mt-12">
          <h2 id="videos-heading" className="font-display text-3xl uppercase tracking-wide">
            From the archive
          </h2>
          {member.videos.length > 0 ? (
            <div className="mt-6 space-y-6">
              {member.videos.map((video) => (
                <VideoEmbed key={video.youtubeId} video={video} />
              ))}
            </div>
          ) : (
            <p className="mt-4 text-muted">No archived videos have been added for {member.handle} yet.</p>
          )}
        </section>

        {entries.length > 0 && (
          <section aria-labelledby="moments-heading" className="mt-12">
            <h2 id="moments-heading" className="font-display text-3xl uppercase tracking-wide">
              In the timeline
            </h2>
            <ol className="mt-4 space-y-2">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/vault#${entryAnchor(entry.id)}`}
                    className="underline decoration-accent underline-offset-4 hover:text-accent"
                  >
                    <time dateTime={entry.date} className="font-mono text-muted">
                      {formatEntryDate(entry)}
                    </time>{" "}
                    {entry.title}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}
      </article>
    </PageShell>
  );
}
