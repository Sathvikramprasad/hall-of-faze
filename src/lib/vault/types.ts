// Shared types for the FaZe Vault (timeline, member profiles, Historian).
// Plain TypeScript only — safe to import from client and server components.

export type SourceLink = {
  /** Publication or site name, e.g. "Tubefilter". */
  label: string;
  url: string;
};

export type VaultCategory =
  | "origins"
  | "esports"
  | "business"
  | "creators"
  | "culture"
  | "controversy";

export type VaultEntry = {
  /** Stable id, also used as the anchor on /vault (#entry-<id>). */
  id: string;
  /** ISO date (YYYY-MM-DD). Use the first of the month when only the month is known. */
  date: string;
  /** How much of `date` is known. Defaults to "day". */
  datePrecision?: "day" | "month" | "year";
  title: string;
  /** One or two sentences, written in our own words. */
  summary: string;
  category: VaultCategory;
  /** Slugs from members.ts. */
  memberSlugs?: string[];
  /** Every entry needs at least one source. */
  sources: [SourceLink, ...SourceLink[]];
  /** Optional historical clip shown with the entry. Credit the original uploader. */
  video?: VideoEmbed;
};

export type VideoEmbed = {
  /** YouTube video id (the part after v=). */
  youtubeId: string;
  title: string;
  /** Channel or creator credited in the attribution line. */
  credit: string;
  /** Original upload year, if known. */
  year?: number;
};

export type MemberProfile = {
  slug: string;
  /** Gamer tag as commonly written, e.g. "FaZe Banks". */
  handle: string;
  realName?: string;
  /** Short role description, e.g. "Co-founder". */
  role: string;
  /** Free-text era, e.g. "2010–" or "2024–2025". */
  era?: string;
  bio: string;
  sources: [SourceLink, ...SourceLink[]];
  videos: VideoEmbed[];
};

export type MonthlyTop3Entry = {
  rank: 1 | 2 | 3;
  title: string;
  creator: string;
  category: string;
  votes: number;
  href?: string;
};
