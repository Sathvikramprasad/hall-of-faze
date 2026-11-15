import type { VaultEntry } from "./types";

// Curated sample lore for the FaZe Vault timeline.
//
// Rules for adding entries:
//  - Every entry needs at least one source a reader can open.
//  - Write summaries in your own words; don't paste article text.
//  - Keep entries sorted by date (getVaultEntries() sorts anyway).
//
// The Historian answers ONLY from this file and members.ts, so anything
// missing here is something it can't talk about.

export const vaultEntries: VaultEntry[] = [
  {
    id: "faze-sniping-debut",
    date: "2010-05-30",
    title: "FaZe Sniping posts its first video",
    summary:
      "Three Call of Duty players, CLipZ, House Cat and Resistance, launch a YouTube channel built around Modern Warfare 2 trickshots. The group later becomes FaZe Clan.",
    category: "origins",
    memberSlugs: ["clipz", "housecat", "resistance"],
    sources: [
      { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" },
      {
        label: "Upcomer",
        url: "https://upcomer.com/faze-dirty-the-origin-story-of-an-original-faze-5-winner",
      },
    ],
  },
  {
    id: "tfue-lawsuit",
    date: "2019-05-20",
    title: "Tfue sues FaZe over his contract",
    summary:
      "Fortnite star Turner \"Tfue\" Tenney files suit claiming his FaZe contract was one-sided and limited his brand deals. FaZe denies taking the share he alleged and later countersues; the dispute becomes one of esports' best-known contract fights.",
    category: "controversy",
    memberSlugs: ["banks"],
    sources: [
      {
        label: "ESPN",
        url: "https://africa.espn.com/esports/story/_/id/26788508/fortnite-player-tfue-suing-faze-clan",
      },
      {
        label: "PC Gamer",
        url: "https://www.pcgamer.com/uk/faze-clan-is-being-sued-by-one-of-its-top-fortnite-players-over-oppressive-and-predatory-contracts/",
      },
    ],
  },
  {
    id: "atlanta-faze-cdl-champs-2021",
    date: "2021-08-22",
    title: "Atlanta FaZe win CDL Champs",
    summary:
      "A year after losing the 2020 final, Atlanta FaZe beat the Toronto Ultra 5–3 to win the 2021 Call of Duty League Championship, described at the time as the organization's first world title.",
    category: "esports",
    sources: [
      {
        label: "Upcomer",
        url: "https://www.upcomer.com/atlanta-faze-defeat-toronto-ultra-to-become-cdl-champs/",
      },
      {
        label: "Atlanta Journal-Constitution",
        url: "https://www.ajc.com/sports/state-sports/atlanta-faze-captures-cod-league-championship/C22BE2YEW5DM7HR7WH6OR277TI",
      },
    ],
  },
  {
    id: "faze-snoop",
    date: "2022-03-07",
    title: "Snoop Dogg joins as \"FaZe Snoop\"",
    summary:
      "FaZe announces Snoop Dogg as a member of its talent network and, once the company goes public, a member of its board of directors.",
    category: "business",
    sources: [
      {
        label: "The Hollywood Reporter",
        url: "https://www.hollywoodreporter.com/business/digital/snoop-dogg-joins-faze-clan-talent-network-board-of-directors-1235103724/",
      },
    ],
  },
  {
    id: "pgl-major-antwerp-2022",
    date: "2022-05-22",
    title: "FaZe win the PGL Major Antwerp",
    summary:
      "FaZe's CS:GO roster of karrigan, rain, broky, ropz and Twistzz beat Natus Vincere 2–0 in the final, the first time a fully international lineup won a CS:GO Major.",
    category: "esports",
    memberSlugs: ["karrigan"],
    sources: [
      {
        label: "Wikipedia: PGL Major Antwerp 2022",
        url: "https://en.wikipedia.org/wiki/PGL_Major_Antwerp_2022",
      },
      {
        label: "Dexerto",
        url: "https://dexerto.com/csgo/faze-reveal-behind-the-scenes-of-csgo-teams-major-antwerp-win-1836415",
      },
    ],
  },
  {
    id: "nasdaq-listing",
    date: "2022-07-20",
    title: "FaZe goes public on Nasdaq",
    summary:
      "After merging with the SPAC B. Riley Principal 150 Merger Corp., FaZe begins trading under the ticker FAZE. The stock falls roughly a quarter on its first day.",
    category: "business",
    sources: [
      {
        label: "FaZe Clan press release",
        url: "https://investor.fazeclan.com/node/7176/pdf",
      },
      {
        label: "Tubefilter",
        url: "https://tubefilter.com/2022/07/20/faze-clan-nasdaq-public-trading-debut/",
      },
    ],
  },
  {
    id: "gamesquare-deal-announced",
    date: "2023-10-20",
    title: "GameSquare agrees to buy FaZe",
    summary:
      "GameSquare announces an all-stock deal to acquire FaZe and says original members Banks, Temperrr and Apex will return to lead the brand.",
    category: "business",
    memberSlugs: ["banks", "temperrr", "apex"],
    sources: [
      {
        label: "Tubefilter",
        url: "https://tubefilter.com/2023/10/20/gamesquare-esports-acquires-faze-clan-banks-temperrr-apex-leadership/",
      },
    ],
  },
  {
    id: "gamesquare-deal-closed",
    date: "2024-03-08",
    title: "GameSquare completes the acquisition",
    summary:
      "GameSquare announces it has closed the FaZe deal, with Banks, Temperrr and Apex back in charge of the brand.",
    category: "business",
    memberSlugs: ["banks", "temperrr", "apex"],
    sources: [
      {
        label: "GameSquare investor news",
        url: "https://investors.gamesquare.com/news/news-details/2024/GameSquare-Announces-Completion-of-Faze-Clan-Acquisition/",
      },
    ],
  },
  {
    id: "faze-reboot",
    date: "2024-04-27",
    title: "Banks reboots the roster",
    summary:
      "Banks cuts the creator roster down to fourteen to \"reboot\" FaZe. Over the next few days Silky, JasonTheWeen and Lacy are announced as new members.",
    category: "creators",
    memberSlugs: ["banks", "jasontheween"],
    sources: [
      { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" },
      {
        label: "Dexerto",
        url: "https://www.dexerto.com/twitch/faze-clan-full-roster-2676401/",
      },
    ],
  },
  {
    id: "creator-exodus",
    date: "2025-12-25",
    title: "Core creators leave",
    summary:
      "Stable Ronaldo, JasonTheWeen, Lacy, Silky and Adapt each post that they have left FaZe, emptying most of the streaming roster built during the reboot.",
    category: "creators",
    memberSlugs: ["jasontheween"],
    sources: [
      {
        label: "International Business Times UK",
        url: "https://www.ibtimes.co.uk/faze-clan-hit-major-exits-stable-ronaldo-silky-lacy-jasontheween-leave-1765943",
      },
    ],
  },
  {
    id: "esports-focus-2026",
    // Dust2.us reported the post on Dec 28, 2025; the exact post date isn't given.
    date: "2025-12-28",
    title: "FaZe says 2026 is about esports",
    summary:
      "Days after the creator departures, FaZe posts that its focus heading into 2026 will be its esports division.",
    category: "esports",
    sources: [
      {
        label: "Dust2.us",
        url: "https://www.dust2.us/news/69124/faze-to-focus-on-esports-in-2026-after-dramatic-exodus-of-top-influencers-content-creators",
      },
    ],
  },
  {
    id: "six-invitational-2026",
    date: "2026-02-15",
    title: "Back-to-back Six Invitational titles",
    summary:
      "FaZe's Brazilian Rainbow Six Siege roster beats Team Secret 3–1 in Paris, becoming the first team to win the Six Invitational two years running.",
    category: "esports",
    sources: [
      {
        label: "SiegeGG",
        url: "https://siege.gg/na/faze-clan-have-won-the-six-invitational-2026-after-two-infinite-overtime-maps",
      },
      {
        label: "Juked",
        url: "https://juked.gg/rainbow-6-siege/news/faze-clan-clinch-back-to-back-six-invitational-titles-with-3-1-win-over-team-secret-in-paris",
      },
    ],
  },
  {
    id: "faze-up-next",
    date: "2026-04-14",
    title: "FaZe Up Next academy announced",
    summary:
      "FaZe unveils FaZe Up Next, an academy program for developing future esports talent.",
    category: "esports",
    sources: [
      {
        label: "SiegeGG",
        url: "https://siege.gg/lan/faze-clan-unveil-new-academy-program-called-faze-up-next",
      },
    ],
  },
];
