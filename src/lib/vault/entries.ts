import type { VaultEntry } from "./types";

// Curated sample lore for the FaZe Vault timeline.
//
// Rules for adding entries:
//  - Every entry needs at least one source a reader can open.
//  - Write summaries in your own words; don't paste article text.
//  - Keep entries sorted by date (getVaultEntries() sorts anyway).
//
// The Historian answers from this file and members.ts, and shows these source
// links beside its answers so readers can verify the underlying facts.

export const vaultEntries: VaultEntry[] = [
  {
    id: "faze-sniping-debut",
    date: "2010-05-30",
    title: "FaZe Sniping posts its first video",
    summary:
      "Three Call of Duty players, CLipZ, House Cat and Resistance, found FaZe Sniping and launch a YouTube channel built around Modern Warfare 2 trickshots. The group later becomes FaZe Clan.",
    category: "origins",
    memberSlugs: ["clipz", "housecat", "resistance"],
    sources: [
      { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" },
      {
        label: "My Favorite Things Wiki: FaZe Clan",
        url: "https://my-favorite-things.fandom.com/wiki/FaZe_Clan",
      },
      {
        label: "Upcomer",
        url: "https://upcomer.com/faze-dirty-the-origin-story-of-an-original-faze-5-winner",
      },
    ],
  },
  {
    id: "one-million-teamtage",
    date: "2012-10-08",
    title: "1 million subscribers and the teamtage",
    summary:
      "The FaZe Clan channel passes one million subscribers and celebrates with a teamtage edited by FaZe MinK. At 12.1 million views, it is still FaZe's most-watched video.",
    category: "origins",
    sources: [
      {
        label: "Tubefilter",
        url: "https://www.tubefilter.com/2018/04/26/what-is-faze-clan-gaming-youtube-twitch/",
      },
      {
        label: "FaZe Clan on X (7-year anniversary post)",
        url: "https://x.com/FaZeClan/status/1181623878176706567",
      },
      { label: "The video on YouTube", url: "https://www.youtube.com/watch?v=CBM-NZdWyk4" },
    ],
    video: {
      youtubeId: "CBM-NZdWyk4",
      title: "FaZe: 1 Million Subscribers Teamtage by FaZe MinK",
      credit: "FaZe Clan (edited by FaZe MinK)",
      year: 2012,
    },
  },
  {
    id: "rug-joins",
    date: "2013-01-01",
    datePrecision: "month",
    title: "FaZe Rug joins",
    summary:
      "Six months after starting his YouTube channel, Brian \"Rug\" Awadis is invited into FaZe. He grows into the clan's biggest individual YouTuber.",
    category: "creators",
    memberSlugs: ["rug"],
    sources: [
      { label: "Wikipedia: FaZe Rug", url: "https://en.wikipedia.org/wiki/FaZe_Rug" },
      {
        label: "Complex",
        url: "https://www.complex.com/pop-culture/a/taffeta-chime/faze-clan-streaming-twitch-youtube-explainer",
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
    id: "forbes-19m-followers",
    date: "2019-11-05",
    title: "Bigger than the Cowboys and Yankees combined",
    summary:
      "Forbes counts 19 million social followers for FaZe, more than the Dallas Cowboys and New York Yankees combined, and ranks it No. 4 among the most valuable esports companies at $240 million.",
    category: "business",
    sources: [
      {
        label: "Forbes",
        url: "https://www.forbes.com/sites/christinasettimi/2019/11/05/awful-business-or-the-new-gold-rush-the-most-valuable-companies-in-esports-are-surging/",
      },
      {
        label: "Boss Hunting",
        url: "https://www.bosshunting.com.au/sport/forbes-confirms-most-profitable-esports-teams",
      },
    ],
  },
  {
    id: "swagg-joins",
    date: "2020-04-04",
    title: "Swagg joins, then brings the Nuke Squad",
    summary:
      "Call of Duty creator Swagg lands his spot by answering FaZe's April Fools open call, and becomes one of the top Warzone streamers. He later surprises his Nuke Squad friends JSmooth, Santana and Booya live on stream with the news that they're joining FaZe too.",
    category: "creators",
    memberSlugs: ["swagg"],
    sources: [
      {
        label: "Dexerto",
        url: "https://www.dexerto.com/call-of-duty/swagg-becomes-the-latest-call-of-duty-youtuber-to-join-faze-clan-1349332/",
      },
      {
        label: "FaZe Clan press release: Nuke Squad",
        url: "https://investor.fazeclan.com/news-releases/news-release-details/faze-clan-welcomes-nuke-squad-official-members",
      },
      {
        label: "Sportskeeda",
        url: "https://www.sportskeeda.com/esports/how-faze-swagg-become-popular",
      },
    ],
  },
  {
    id: "sports-illustrated-cover",
    date: "2021-06-10",
    title: "First esports org on the cover of Sports Illustrated",
    summary:
      "FaZe fronts Sports Illustrated's July 2021 issue, the first esports organization on its cover. Rug, Swagg, Temperrr and NICKMERCS share it with Bronny James and Kyler Murray.",
    category: "culture",
    memberSlugs: ["rug", "swagg", "temperrr"],
    sources: [
      {
        label: "Sports Illustrated via Business Wire",
        url: "https://www.businesswire.com/news/home/20210610005834/en/FaZe-Clan-Reaches-Beyond-World-of-Esports-Onto-Cover-of-Sports-Illustrated%E2%80%99s-July-Issue",
      },
      {
        label: "Tubefilter",
        url: "https://tubefilter.com/2021/06/11/faze-clan-first-esports-org-sports-illustrated/",
      },
      { label: "TSN", url: "https://www.tsn.ca/1.1652727" },
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
    memberSlugs: ["snoop"],
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
    id: "nike-lebron-nxxt-gen",
    date: "2023-03-09",
    title: "FaZe x Nike LeBron NXXT Gen",
    summary:
      "LeBron James debuts a FaZe colorway of his Nike LeBron NXXT Gen in a December 2022 Lakers game, and Bronny James wears it for Sierra Canyon. The collab goes on sale March 9, 2023.",
    category: "culture",
    sources: [
      {
        label: "Hypebeast (LeBron's debut)",
        url: "https://hypebeast.com/2022/12/lebron-james-faze-clan-nike-lebron-20-nxxt-first-look-release-info",
      },
      {
        label: "Hypebeast (announcement)",
        url: "https://hypebeast.com/2023/1/faze-clan-nike-zoom-lebron-nxxt-gen-dr8784-001-release-date",
      },
      {
        label: "Sneaker News",
        url: "https://sneakernews.com/2023/01/27/faze-clan-nike-lebron-nxxt-gen-release-date/",
      },
    ],
  },
  {
    id: "halo-world-champions-2023",
    date: "2023-10-01",
    datePrecision: "month",
    title: "Halo World Champions",
    summary:
      "Frosty, Renegade, Royal2 and SnakeBite fight back from the elimination bracket in Seattle and beat defending champions OpTic Gaming in the grand final, FaZe's first Halo world title.",
    category: "esports",
    sources: [
      { label: "Halo Waypoint", url: "https://www.halowaypoint.com/news/halowc2023" },
      {
        label: "Esports.net",
        url: "https://www.esports.net/news/halo/faze-clan-hcs-win",
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
    id: "streamer-awards-2024",
    date: "2024-12-07",
    title: "Best Content Organization at the Streamer Awards",
    summary:
      "In the reboot's first year, FaZe beats OTK, VShojo and AMP for Best Content Organization at QTCinderella's Streamer Awards.",
    category: "creators",
    sources: [
      {
        label: "Streams Charts",
        url: "https://streamscharts.com/news/streamer-awards-2024-dec-recap",
      },
      {
        label: "Dot Esports",
        url: "https://dotesports.com/streaming/news/all-2024-streamer-awards-winners",
      },
    ],
  },
  {
    id: "streamer-awards-2025",
    date: "2025-12-06",
    title: "Best Content Organization, two years running",
    summary:
      "FaZe wins Best Content Organization at the Streamer Awards for the second year in a row, ahead of Hololive, OSCS and AMP.",
    category: "creators",
    sources: [
      {
        label: "Streams Charts",
        url: "https://streamscharts.com/news/streamer-awards-2025-winners",
      },
      {
        label: "Dot Esports",
        url: "https://dotesports.com/uncategorized/news/ishowspeed-and-kai-cenat-dominate-the-streamer-awards-2025",
      },
    ],
  },
  {
    id: "hardscope-launch",
    date: "2025-12-16",
    title: "FaZe's media business becomes part of HardScope",
    summary:
      "DraftKings co-founder Matt Kalish launches HardScope, a creator media and commerce company run by the team behind FaZe's 2024 relaunch. FaZe's media business sits under HardScope, while its esports teams remain with GameSquare.",
    category: "business",
    sources: [
      {
        label: "Tubefilter",
        url: "https://www.tubefilter.com/2025/12/16/a-draftkings-co-founder-just-launched-a-company-to-build-empires-for-creators/",
      },
      {
        label: "TheWrap",
        url: "https://www.thewrap.com/draftkings-cofounder-launches-creator-platform-hardscope/",
      },
      {
        label: "AdExchanger",
        url: "https://www.adexchanger.com/social-media/a-co-founder-of-draftkings-wants-to-help-creators-monetize-content/",
      },
      {
        label: "ShaneTheGamer",
        url: "https://www.shanethegamer.com/news/faze-clan-esports-focus-2026/",
      },
    ],
  },
  {
    id: "creator-exodus",
    date: "2025-12-25",
    title: "Core creators leave",
    summary:
      "After contract talks with HardScope break down, Stable Ronaldo, JasonTheWeen, Lacy, Silky and Adapt each post that they have left FaZe. Rug announces his own exit two days later.",
    category: "creators",
    memberSlugs: ["jasontheween", "rug"],
    sources: [
      {
        label: "International Business Times UK",
        url: "https://www.ibtimes.co.uk/faze-clan-hit-major-exits-stable-ronaldo-silky-lacy-jasontheween-leave-1765943",
      },
      {
        label: "Net Influencer",
        url: "https://www.netinfluencer.com/faze-clan-loses-six-influencers-as-contract-negotiations-with-hardscope-collapse",
      },
      { label: "Wikipedia: FaZe Rug", url: "https://en.wikipedia.org/wiki/FaZe_Rug" },
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
