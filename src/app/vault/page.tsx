import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { MemberCard } from "@/components/vault/MemberCard";
import { VaultBanner, VaultDivider } from "@/components/vault/VaultBanner";
import { VaultTimeline } from "@/components/vault/VaultTimeline";
import { VAULT_END_YEAR, VAULT_START_YEAR, getMembers } from "@/lib/vault/queries";

export const metadata: Metadata = {
  title: "The FaZe Vault | Hall of FaZe",
  description: `A sourced timeline of FaZe history from ${VAULT_START_YEAR} to ${VAULT_END_YEAR}, with member profiles and FaZe Bot.`,
};

export default function VaultPage() {
  const members = getMembers();

  return (
    <PageShell>
      <VaultBanner>
        <header className="max-w-3xl [text-shadow:0_2px_12px_rgba(0,0,0,0.9)]">
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-accent">
            {VAULT_START_YEAR}–{VAULT_END_YEAR}
          </p>
          <h1 className="mt-2 font-display text-5xl uppercase tracking-wide sm:text-7xl">The FaZe Vault</h1>
          <p className="mt-4 text-lg leading-8 text-white/80">
            From the first trickshot videos to the latest titles. Every milestone links to its
            sources.
          </p>
        </header>
      </VaultBanner>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <section aria-labelledby="timeline-heading">
          <VaultDivider id="timeline-heading">Timeline</VaultDivider>
          <div className="mt-10">
            <VaultTimeline />
          </div>
        </section>

        <section aria-labelledby="members-heading" className="mt-20">
          <h2 id="members-heading" className="font-display text-3xl uppercase tracking-wide">
            Members
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {members.map((member) => (
              <MemberCard key={member.slug} member={member} />
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
