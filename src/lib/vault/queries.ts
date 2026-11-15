import { vaultEntries } from "./entries";
import { memberProfiles } from "./members";
import { vaultStats } from "./stats";
import type { MemberProfile, VaultCategory, VaultEntry, VaultStat } from "./types";

// Read helpers for the curated Vault data. Everything here is synchronous and
// static today; when the data moves to MongoDB, keep these signatures and swap
// the bodies so pages don't need to change.

export const VAULT_START_YEAR = 2010;
export const VAULT_END_YEAR = 2026;

export const VAULT_YEARS: number[] = Array.from(
  { length: VAULT_END_YEAR - VAULT_START_YEAR + 1 },
  (_, i) => VAULT_START_YEAR + i,
);

export const CATEGORY_LABELS: Record<VaultCategory, string> = {
  origins: "Origins",
  esports: "Esports",
  business: "Business",
  creators: "Creators",
  culture: "Culture",
  controversy: "Controversy",
};

export function getVaultEntries(): VaultEntry[] {
  return [...vaultEntries].sort((a, b) => a.date.localeCompare(b.date));
}

export function getEntryYear(entry: VaultEntry): number {
  return Number(entry.date.slice(0, 4));
}

/** Entries grouped by year, only for years that have entries. */
export function getEntriesByYear(): { year: number; entries: VaultEntry[] }[] {
  const groups = new Map<number, VaultEntry[]>();
  for (const entry of getVaultEntries()) {
    const year = getEntryYear(entry);
    groups.set(year, [...(groups.get(year) ?? []), entry]);
  }
  return [...groups.entries()].map(([year, entries]) => ({ year, entries }));
}

export function getVaultStats(): VaultStat[] {
  return [...vaultStats].sort((a, b) => a.date.localeCompare(b.date));
}

/** Every year that has entries or stats, with both, in order. */
export function getTimelineByYear(): { year: number; entries: VaultEntry[]; stats: VaultStat[] }[] {
  const years = new Map<number, { entries: VaultEntry[]; stats: VaultStat[] }>();
  const bucket = (year: number) => {
    if (!years.has(year)) years.set(year, { entries: [], stats: [] });
    return years.get(year)!;
  };
  for (const entry of getVaultEntries()) bucket(getEntryYear(entry)).entries.push(entry);
  for (const stat of getVaultStats()) bucket(Number(stat.date.slice(0, 4))).stats.push(stat);
  return [...years.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, group]) => ({ year, ...group }));
}

export function getEntry(id: string): VaultEntry | undefined {
  return vaultEntries.find((entry) => entry.id === id);
}

export function getMembers(): MemberProfile[] {
  return memberProfiles;
}

export function getMember(slug: string): MemberProfile | undefined {
  return memberProfiles.find((member) => member.slug === slug);
}

export function getEntriesForMember(slug: string): VaultEntry[] {
  return getVaultEntries().filter((entry) => entry.memberSlugs?.includes(slug));
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "May 30, 2010", "May 2010" or "2010" depending on datePrecision. */
export function formatEntryDate(entry: Pick<VaultEntry, "date" | "datePrecision">): string {
  const [year, month, day] = entry.date.split("-").map(Number);
  const precision = entry.datePrecision ?? "day";
  if (precision === "year") return String(year);
  if (precision === "month") return `${MONTHS[month - 1]} ${year}`;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export function entryAnchor(id: string): string {
  return `entry-${id}`;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "at",
  "by", "is", "was", "were", "did", "do", "does", "what", "when", "who", "why",
  "how", "which", "faze", "clan", "about", "tell", "me", "it", "its", "that",
  "best", "happened", "happen", "there", "their", "they", "this", "many",
  "much", "ever", "any", "has", "have", "had", "are", "you", "can",
  "with", "from", "into", "then", "them", "been",
]);

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/** Very rough stemming so "founded" matches "founder", "trading" matches "trade". */
function stem(word: string): string {
  for (const suffix of ["ing", "ers", "ed", "er", "es", "s"]) {
    if (word.endsWith(suffix) && word.length - suffix.length >= 4) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

/**
 * Simple keyword match used when the Historian can't call Gemini, so the user
 * still gets pointed at relevant Vault entries.
 */
export function findRelatedEntries(question: string, limit = 3): VaultEntry[] {
  const stems = tokenize(question)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .map(stem);
  if (stems.length === 0) return [];

  const memberText = new Map(
    memberProfiles.map((m) => [m.slug, `${m.handle} ${m.realName ?? ""} ${m.role}`]),
  );

  const docs = getVaultEntries().map((entry) => ({
    entry,
    titleTokens: tokenize(entry.title),
    bodyTokens: tokenize(
      [
        entry.summary,
        entry.date.slice(0, 4),
        CATEGORY_LABELS[entry.category],
        ...(entry.memberSlugs ?? []).map((slug) => memberText.get(slug) ?? ""),
      ].join(" "),
    ),
  }));
  const matches = (tokens: string[], s: string) => tokens.some((t) => t.startsWith(s));

  // Rare words matter more: "halo" (1 entry) should outrank "win" (many entries).
  const weight = new Map(
    stems.map((s) => {
      const hits = docs.filter((d) => matches(d.titleTokens, s) || matches(d.bodyTokens, s)).length;
      return [s, hits > 0 ? 1 / hits : 0];
    }),
  );

  return docs
    .map(({ entry, titleTokens, bodyTokens }) => {
      // Title hits count double so "go public" prefers the Nasdaq entry.
      const score = stems.reduce((total, s) => {
        const w = weight.get(s) ?? 0;
        if (matches(titleTokens, s)) return total + 2 * w;
        if (matches(bodyTokens, s)) return total + w;
        return total;
      }, 0);
      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => entry);
}
