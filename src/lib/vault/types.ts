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

/** A dated number shown as a compact marker in its year, e.g. a subscriber count. */
export type VaultStat = {
  id: string;
  /** ISO date (YYYY-MM-DD). Use the first of the month/year when only that is known. */
  date: string;
  datePrecision?: "day" | "month" | "year";
  /** Display value, e.g. "3.63M". */
  value: string;
  /** What the value counts, e.g. "YouTube subscribers". */
  label: string;
  /** Short context, e.g. "Guinness World Record". */
  note?: string;
  sources: [SourceLink, ...SourceLink[]];
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

/** A FaZe team or division. Groups today's rosters on the Vault page. */
export type MemberDivision = "Counter-Strike 2" | "Rainbow Six Siege" | "Call of Duty" | "Content";

export type MemberProfile = {
  slug: string;
  /** Gamer tag as commonly written, e.g. "FaZe Banks". */
  handle: string;
  realName?: string;
  /**
   * Profile photo under public/, e.g. "/vault/members/swagg.webp" (square, 256px+).
   * Only use images you have permission to publish. Without one, cards show the
   * member's initial on FaZe camo.
   */
  photo?: string;
  /** Short role description, e.g. "Co-founder". */
  role: string;
  /** Free-text era, e.g. "2010–" or "2024–2025". */
  era?: string;
  /**
   * The FaZe roster they're on today (as of ROSTER_AS_OF in members.ts). Leave it
   * unset for founders and former members; they're listed under Past members.
   */
  currentRoster?: MemberDivision;
  /**
   * Games they play or are known for, e.g. ["Counter-Strike 2"]. Shown on the
   * member's hover card and profile page. Leave it out when no game fits
   * (for example a Just Chatting streamer).
   */
  games?: string[];
  bio: string;
  sources: [SourceLink, ...SourceLink[]];
  videos: VideoEmbed[];
  /**
   * Their own channels, for live status and current YouTube stats. Only add
   * channels you've confirmed belong to them: a YouTube channel id (UC…) or
   * @handle, and a Twitch login.
   */
  channels?: { twitch?: string; youtubeChannelId?: string; youtubeHandle?: string };
};

export type MonthlyTop3Entry = {
  rank: 1 | 2 | 3;
  title: string;
  creator: string;
  category: string;
  votes: number;
  href?: string;
};
