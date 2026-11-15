import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { HistorianPanel } from "@/components/vault/HistorianPanel";
import { MemberCard } from "@/components/vault/MemberCard";
import { VaultTimeline } from "@/components/vault/VaultTimeline";
import { VAULT_END_YEAR, VAULT_START_YEAR, getMembers } from "@/lib/vault/queries";

export const metadata: Metadata = {
  title: "The FaZe Vault | Hall of FaZe",
  description: `A sourced timeline of FaZe history from ${VAULT_START_YEAR} to ${VAULT_END_YEAR}, with member profiles and an AI Historian.`,
};

export default function VaultPage() {
  const members = getMembers();

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="max-w-3xl">
          <p className="font-mono text-sm font-semibold uppercase tracking-widest text-accent">
            {VAULT_START_YEAR}–{VAULT_END_YEAR}
          </p>
          <h1 className="mt-2 font-display text-5xl uppercase tracking-wide sm:text-7xl">The FaZe Vault</h1>
          <p className="mt-4 text-lg leading-8 text-muted">
            From the first trickshot videos to the latest titles. Every milestone links to its
            sources.
          </p>
        </header>

        <section aria-labelledby="timeline-heading" className="mt-12">
          <h2 id="timeline-heading" className="sr-only">
            Timeline
          </h2>
          <VaultTimeline />
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

        <div className="mt-20">
          <HistorianPanel />
        </div>
      </div>
    </PageShell>
  );
}
