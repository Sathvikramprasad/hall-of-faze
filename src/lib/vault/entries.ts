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
    id: "apex-joins",
    date: "2011-01-01",
    datePrecision: "year",
    title: "FaZe Apex joins",
    summary:
      "Yousef \"Apex\" Abdelfattah joins FaZe, the start of a run that takes him from trickshot videos into the company's leadership.",
    category: "creators",
    memberSlugs: ["apex"],
    sources: [
      {
        label: "Complex",
        url: "https://www.complex.com/pop-culture/a/taffeta-chime/faze-clan-streaming-twitch-youtube-explainer",
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
    id: "first-faze-house",
    date: "2014-01-01",
    datePrecision: "year",
    title: "The first FaZe House",
    summary:
      "Temperrr and Banks open the first FaZe shared home in Plainview, New York, so members can mix lifestyle content into their gaming videos. Every creator who lived there goes on to pass 1.5 million YouTube subscribers.",
    category: "creators",
    memberSlugs: ["temperrr", "banks"],
    sources: [
      { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" },
      {
        label: "Tubefilter",
        url: "https://www.tubefilter.com/2018/04/26/what-is-faze-clan-gaming-youtube-twitch/",
      },
    ],
  },
  {
    id: "hubrick-investment",
    date: "2015-01-01",
    datePrecision: "year",
    title: "Hubrick invests and Lee Trink arrives",
    summary:
      "Social platform Hubrick, run by Norwegian entrepreneur Sebastian Geurts, invests in FaZe and brings in former record executive Lee Trink, who later becomes CEO.",
    category: "business",
    sources: [
      { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" },
      {
        label: "Tubefilter",
        url: "https://www.tubefilter.com/2018/04/26/what-is-faze-clan-gaming-youtube-twitch/",
      },
    ],
  },
  {
    id: "csgo-entry-2016",
    date: "2016-01-01",
    datePrecision: "month",
    title: "FaZe enters Counter-Strike",
    summary:
      "FaZe acquires G2 Esports' international CS:GO roster, which plays its first Major under the FaZe name at MLG Columbus that spring.",
    category: "esports",
    sources: [
      { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" },
      { label: "pley.gg", url: "https://pley.gg/cs2/faze/" },
    ],
  },
  {
    id: "eleague-premier-2017",
    date: "2017-10-13",
    title: "ELEAGUE CS:GO Premier champions",
    summary:
      "FaZe sweep Astralis 2–0 in Atlanta to win ELEAGUE CS:GO Premier and its $500,000 first prize, with rain named MVP.",
    category: "esports",
    sources: [
      {
        label: "Wikipedia: ELEAGUE CS:GO Premier",
        url: "https://en.wikipedia.org/wiki/ELeague_CS:GO_Premier",
      },
      {
        label: "Shacknews",
        url: "https://shacknews.com/article/101716/faze-clan-wins-eleague-csgo-premier-and-500k-grand-prize",
      },
    ],
  },
  {
    id: "boston-major-2018",
    date: "2018-01-28",
    title: "So close in Boston",
    summary:
      "Favorites FaZe reach the ELEAGUE Major final in Boston but fall 2–1 to Cloud9, losing the deciding map 22–19 in double overtime.",
    category: "esports",
    memberSlugs: ["karrigan"],
    sources: [
      {
        label: "Wikipedia: ELEAGUE Major: Boston 2018",
        url: "https://en.wikipedia.org/wiki/ELEAGUE_Major:_Boston_2018",
      },
      {
        label: "Dust2.us",
        url: "https://dust2.us/news/636/cloud9-take-down-faze-in-close-games-claim-major-title",
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
  // ---------------------------------------------------------------------
  // Added in the "populate" pass (Nov 2026). Mostly from the Wikipedia and
  // My Favorite Things Wiki pages on FaZe Clan, with event results checked
  // against tournament coverage. Year-only dates use datePrecision "year".
  // ---------------------------------------------------------------------
  {
    id: "temperrr-joins",
    date: "2010-01-01",
    datePrecision: "year",
    title: "Temperrr joins in year one",
    summary:
      "Thomas \"Temperrr\" Oliveira joins during FaZe's first year. He goes on to become the clan's first CEO and one of its co-owners.",
    category: "origins",
    memberSlugs: ["temperrr"],
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "class-of-2011",
    date: "2011-01-01",
    datePrecision: "year",
    title: "Rain and Teeqo join",
    summary:
      "Rain and Teeqo join the same year as Apex. Rain later becomes one of the clan's co-owners.",
    category: "origins",
    sources: [
      { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" },
      { label: "My Favorite Things Wiki: FaZe Clan", url: "https://my-favorite-things.fandom.com/wiki/FaZe_Clan" },
    ],
  },
  {
    id: "founders-step-away-2012",
    date: "2012-01-01",
    datePrecision: "year",
    title: "CLipZ and Resistance step away",
    summary:
      "Two of the three founders, CLipZ and Resistance, leave the clan in 2012. The same year FaZe starts its long-running partnership with G Fuel.",
    category: "origins",
    memberSlugs: ["clipz", "resistance"],
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "class-of-2013",
    date: "2013-01-01",
    datePrecision: "year",
    title: "Banks, Adapt, Sensei and Kay join",
    summary:
      "Richard \"Banks\" Bengtson joins with Adapt, Sensei and Kay. Banks becomes a co-owner and, years later, the company's CEO.",
    category: "creators",
    memberSlugs: ["banks"],
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "esniping-division",
    date: "2013-09-19",
    title: "FaZe eSniping division launches",
    summary:
      "FaZe announces a competitive sniping division with Zydar, Hyspe and RanbOw, led by WaRTeK. It is renamed FaZe France the following April.",
    category: "esports",
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "faze-red-and-black",
    date: "2014-04-05",
    title: "Two Call of Duty squads: FaZe Red and FaZe Black",
    summary:
      "FaZe picks up a second Call of Duty roster and splits its players into FaZe Red and FaZe Black, an experiment it repeats for the 2015 Call of Duty Championship.",
    category: "esports",
    sources: [{ label: "Call of Duty Esports Wiki: FaZe Red", url: "https://cod-esports.fandom.com/wiki/FaZe_Red" }],
  },
  {
    id: "cod-champs-2015",
    date: "2015-03-29",
    title: "Third at the 2015 Call of Duty Championship",
    summary:
      "FaZe Red finishes third at the Advanced Warfare world championship, earning $120,000, the organization's best Champs result to that point.",
    category: "esports",
    sources: [
      { label: "Esports Earnings: FaZe Clan (Call of Duty)", url: "https://www.esportsearnings.com/teams/240-faze-clan/results/301-call-of-duty" },
      { label: "Call of Duty Esports Wiki: FaZe Red", url: "https://cod-esports.fandom.com/wiki/FaZe_Red" },
    ],
  },
  {
    id: "faze-france-split",
    date: "2015-05-26",
    title: "FaZe France goes its own way",
    summary: "The players and staff of FaZe France leave together to start their own organization.",
    category: "esports",
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "mlg-pro-league-s3-2015",
    date: "2015-09-20",
    title: "MLG Pro League Season 3 champions",
    summary:
      "Clayster, Enable, ZooMaa and Attach win the Advanced Warfare Pro League Season 3 playoffs and $40,000, capping a summer in which they also beat OpTic at UMG Dallas.",
    category: "esports",
    sources: [
      { label: "Esports Earnings: FaZe Clan (Call of Duty)", url: "https://www.esportsearnings.com/teams/240-faze-clan/results/301-call-of-duty" },
      { label: "TheSportsDB: FaZe Clan", url: "https://www.thesportsdb.com/team/136293" },
    ],
  },
  {
    id: "clout-house",
    date: "2017-01-01",
    datePrecision: "year",
    title: "Banks moves to LA and the Clout House",
    summary:
      "Banks relocates to Los Angeles and starts the Clout House, moving FaZe's center of gravity to the West Coast.",
    category: "culture",
    memberSlugs: ["banks"],
    sources: [
      { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" },
      {
        label: "Complex",
        url: "https://www.complex.com/pop-culture/a/taffeta-chime/faze-clan-streaming-twitch-youtube-explainer",
      },
    ],
  },
  {
    id: "esl-one-new-york-2017",
    date: "2017-09-17",
    title: "ESL One New York 2017 champions",
    summary:
      "The revamped CS:GO roster sweeps Team Liquid 3–0 in the final without dropping a map all event, taking $125,000 and its first big trophy with olofmeister and GuardiaN.",
    category: "esports",
    memberSlugs: ["karrigan"],
    sources: [
      { label: "GosuGamers", url: "https://www.gosugamers.net/counterstrike/news/45357-faze-clan-victorious-at-esl-one-new-york-2017" },
      { label: "MCV/DEVELOP", url: "https://www.mcvuk.com/esports/faze-clan-cruise-to-csgo-esl-one-new-york-victory-and-125000/" },
    ],
  },
  {
    id: "fortnite-division",
    date: "2018-03-03",
    title: "FaZe launches a Fortnite team",
    summary:
      "FaZe moves early into Fortnite Battle Royale. Turner \"Tfue\" Tenney joins and becomes the face of the division alongside his duo partner Cloakzy.",
    category: "esports",
    sources: [
      { label: "Fortnite Esports Wiki: FaZe Clan", url: "https://fortnite-esports.fandom.com/wiki/FaZe_Clan" },
      { label: "ESTNN", url: "https://estnn.com/end-of-an-era-tfues-fortnite-journey-from-beginning-to-end" },
    ],
  },
  {
    id: "cwl-stage-one-2018",
    date: "2018-04-08",
    title: "CWL Pro League Stage 1 champions",
    summary:
      "Attach, ZooMaa, Priestahh and Replays beat OpTic in a ten-map final in Columbus for $212,500. It is FaZe's first major Call of Duty LAN title since 2015, and ZooMaa is named stage MVP.",
    category: "esports",
    sources: [
      { label: "Dot Esports", url: "https://dotesports.com/?p=4135" },
      { label: "Esports Earnings: FaZe Clan (Call of Duty)", url: "https://www.esportsearnings.com/teams/240-faze-clan/results/301-call-of-duty" },
    ],
  },
  {
    id: "fall-skirmish-2018",
    date: "2018-10-28",
    title: "Tfue and Cloakzy win the Fall Skirmish",
    summary:
      "At TwitchCon in San Jose the FaZe duo wins the Fortnite Fall Skirmish Grand Finals, taking the $400,000 top prize plus bonuses for a match win and most eliminations, about $510,000 in all.",
    category: "esports",
    sources: [
      { label: "Win.gg", url: "https://win.gg/news/tfue-and-cloak-win-the-fortnite-fall-skirmish-for-faze-clan/" },
      { label: "Liquipedia: Tfue", url: "https://liquipedia.net/fortnite/Tfue" },
    ],
  },
  {
    id: "new-leadership-2018",
    date: "2018-11-22",
    title: "New leadership and the Champion collab",
    summary:
      "Karmaloop founder Greg Selkoe becomes president and Lee Trink becomes CEO in 2018, as FaZe leans into apparel, starting with a Champion collaboration announced in November.",
    category: "business",
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "lil-yachty-inducted",
    date: "2018-12-15",
    title: "Lil Yachty is inducted at Rolling Loud",
    summary:
      "Lil Yachty is welcomed into FaZe on stage at Rolling Loud in Los Angeles, an early sign of the music crossover that defines FaZe's next few years.",
    category: "culture",
    sources: [
      {
        label: "Billboard",
        url: "https://www.billboard.com/pro/inside-the-gaming-collective-thats-drawing-bigtime-music-investors-and-star-players",
      },
    ],
  },
  {
    id: "nickmercs-joins",
    date: "2019-05-30",
    title: "NICKMERCS joins",
    summary:
      "Streamer NICKMERCS joins on FaZe's ninth birthday, after Sway (March) and Jarvis (April). CLipZ also rejoins in 2019, while Censor, karrigan and Tfue leave.",
    category: "creators",
    memberSlugs: ["clipz", "karrigan"],
    sources: [
      { label: "Fortnite Esports Wiki: FaZe Clan", url: "https://fortnite-esports.fandom.com/wiki/FaZe_Clan" },
      { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" },
    ],
  },
  {
    id: "atlanta-faze-announced",
    date: "2019-10-26",
    title: "Atlanta FaZe is announced",
    summary:
      "FaZe and Atlanta Esports Ventures, which bought a Call of Duty League franchise slot in May, unveil Atlanta FaZe for the league's first season.",
    category: "esports",
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "fight-2-fund",
    date: "2020-03-15",
    title: "Fight 2 Fund raises over $124,000",
    summary:
      "Early in the COVID-19 pandemic, FaZe runs the Fight 2 Fund charity stream event and raises more than $124,000.",
    category: "culture",
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "valorant-division",
    date: "2020-06-25",
    title: "FaZe enters VALORANT",
    summary:
      "FaZe launches a VALORANT division weeks after the game's release. Bronny James also joins the clan in 2020, and CLipZ leaves again.",
    category: "esports",
    memberSlugs: ["clipz"],
    sources: [
      { label: "VALORANT Esports Wiki: FaZe Clan", url: "https://valorant-esports.fandom.com/wiki/FaZe_Clan" },
      { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" },
    ],
  },
  {
    id: "save-the-kids",
    date: "2021-01-01",
    datePrecision: "year",
    title: "The Save the Kids token scandal",
    summary:
      "Members are linked to promoting the Save the Kids crypto token. FaZe removes Kay and suspends Jarvis, Teeqo and Nikan; Teeqo is later reinstated after being found uninvolved.",
    category: "controversy",
    sources: [
      { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" },
      {
        label: "Complex",
        url: "https://www.complex.com/pop-culture/a/taffeta-chime/faze-clan-streaming-twitch-youtube-explainer",
      },
    ],
  },
  {
    id: "iem-katowice-2022",
    date: "2022-02-27",
    title: "IEM Katowice 2022 champions",
    summary:
      "After starting in the play-in stage, FaZe sweeps G2 3–0 in a five-hour final. The win starts its run at the Intel Grand Slam.",
    category: "esports",
    memberSlugs: ["karrigan"],
    sources: [
      { label: "Upcomer", url: "https://upcomer.com/faze-clan-beat-g2-esports-in-iem-katowice-2022-grand-final/" },
      { label: "ESL FACEIT Group", url: "https://eslfaceitgroup.com/?p=12788" },
    ],
  },
  {
    id: "epl-s15-2022",
    date: "2022-04-01",
    datePrecision: "month",
    title: "ESL Pro League Season 15 champions",
    summary: "FaZe beats ENCE 3–1 for its second Intel Grand Slam title of the year.",
    category: "esports",
    memberSlugs: ["karrigan"],
    sources: [
      {
        label: "GosuGamers",
        url: "https://www.gosugamers.net/counterstrike/news/66384-faze-win-esl-pro-league-season-17-trophy-and-complete-the-intel-grand-slam-challenge",
      },
    ],
  },
  {
    id: "iem-cologne-2022",
    date: "2022-07-01",
    datePrecision: "month",
    title: "IEM Cologne 2022 champions",
    summary:
      "FaZe beats Natus Vincere 3–2 in the final. With Katowice and the Antwerp Major already won, it now holds the three biggest Counter-Strike trophies of the year and is one title short of the Grand Slam.",
    category: "esports",
    memberSlugs: ["karrigan"],
    sources: [
      {
        label: "esports.gg",
        url: "https://esports.gg/news/cs-go/the-undisputed-world-number-one-faze-clan-are-your-iem-cologne-2022-champions",
      },
      { label: "Hotspawn", url: "https://www.hotspawn.com/?p=63177" },
      {
        label: "GosuGamers",
        url: "https://www.gosugamers.net/counterstrike/news/66384-faze-win-esl-pro-league-season-17-trophy-and-complete-the-intel-grand-slam-challenge",
      },
    ],
  },
  {
    id: "layoffs-2023",
    date: "2023-02-17",
    title: "FaZe lays off a fifth of its staff",
    summary:
      "With its share price below $1, FaZe cuts about 20% of its workforce. A month later Nasdaq warns it could be delisted.",
    category: "business",
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "intel-grand-slam",
    date: "2023-03-26",
    title: "FaZe completes the Intel Grand Slam",
    summary:
      "Beating Cloud9 to win ESL Pro League Season 17 completes the Grand Slam after 392 days, worth a $1,000,000 bonus. FaZe is the fourth team, and the first international roster, to do it.",
    category: "esports",
    memberSlugs: ["karrigan"],
    sources: [
      { label: "ESL", url: "https://esl.com/article/faze-clan-claim-intel-grand-slam-iv" },
      { label: "ESL FACEIT Group", url: "https://eslfaceitgroup.com/?p=16810" },
    ],
  },
  {
    id: "snoop-leaves-board",
    date: "2023-04-01",
    datePrecision: "month",
    title: "Snoop Dogg leaves the board",
    summary: "Snoop Dogg steps off FaZe's board of directors about a year after joining it.",
    category: "business",
    memberSlugs: ["snoop"],
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "trink-out",
    date: "2023-09-11",
    title: "CEO Lee Trink is let go",
    summary:
      "FaZe ends Lee Trink's time as CEO with immediate effect and names Christoph Pachler interim CEO, a month before the GameSquare deal.",
    category: "business",
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "six-invitational-2024",
    date: "2024-02-01",
    datePrecision: "month",
    title: "Six Invitational 2024 runners-up",
    summary:
      "FaZe's Brazilian Rainbow Six Siege roster loses the final 3–2 to w7m esports and takes $450,000 for second place.",
    category: "esports",
    sources: [{ label: "esports.gg", url: "https://esports.gg/news/rainbow-six-siege/six-invitational-2025-overview" }],
  },
  {
    id: "copenhagen-major-2024",
    date: "2024-03-31",
    title: "Runners-up at the first CS2 Major",
    summary:
      "FaZe reaches the final of the PGL Major Copenhagen, the first Counter-Strike 2 Major, and loses 2–1 to Natus Vincere.",
    category: "esports",
    memberSlugs: ["karrigan"],
    sources: [
      { label: "Escorenews", url: "https://escorenews.com/en/csgo/news/57310-navi-wins-first-cs2-major-in-history-pgl-copenhagen-2024-over-faze-clan" },
    ],
  },
  {
    id: "iem-chengdu-2024",
    date: "2024-04-01",
    datePrecision: "month",
    title: "IEM Chengdu 2024 champions",
    summary: "FaZe wins IEM Chengdu, its eighth straight final in the CS2 era.",
    category: "esports",
    memberSlugs: ["karrigan"],
    sources: [
      { label: "Dust2.us", url: "https://dust2.us/news/47386/faze-takes-lead-in-intel-grand-slam-race" },
      {
        label: "bo3.gg",
        url: "https://bo3.gg/articles/as-the-year-began-so-it-ends-faze-spirit-in-the-final-of-perfect-world-shanghai-major-2024",
      },
    ],
  },
  {
    id: "faze-media-formed",
    date: "2024-05-14",
    title: "FaZe Media is formed",
    summary:
      "FaZe's creator business is spun into FaZe Media, led by Banks, with investor Matt Kalish putting in $11 million for 49%. In June Banks buys GameSquare's 25.5% stake.",
    category: "business",
    memberSlugs: ["banks"],
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "shanghai-major-2024",
    date: "2024-12-15",
    title: "Second Major final of the year",
    summary:
      "FaZe loses the Perfect World Shanghai Major final 2–1 to Team Spirit, its second Major final defeat of 2024.",
    category: "esports",
    memberSlugs: ["karrigan"],
    sources: [
      { label: "bo3.gg", url: "https://bo3.gg/articles/thye-end-of-the-faze-era-the-results-of-perfect-world-shanghai-major-2024" },
      { label: "EarlyGame", url: "https://earlygame.com/news/counter-strike-2/cs2-spirit-take-down-faze-crowned-champions-at-perfect-world-shanghai-major" },
    ],
  },
  {
    id: "six-invitational-2025",
    date: "2025-02-16",
    title: "Six Invitational 2025 champions: $1,000,000",
    summary:
      "A year after losing the final, FaZe's Brazilian Siege roster beats Team BDS 3–1 in Boston for the organization's first Rainbow Six world title and $1 million. Handy is named MVP.",
    category: "esports",
    sources: [
      { label: "SiegeGG", url: "https://siege.gg/na/faze-clan-wins-six-invitational-2025" },
      { label: "Sportskeeda", url: "https://sportskeeda.com/esports/faze-clan-rainbow-six-invitational-2025-champion" },
    ],
  },
  {
    id: "gamesquare-exits-media",
    date: "2025-03-31",
    title: "GameSquare sells its FaZe Media stake",
    summary:
      "GameSquare divests its remaining 25.5% of FaZe Media but keeps FaZe Esports, splitting the creator brand from the competitive teams.",
    category: "business",
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "banks-steps-down",
    date: "2025-07-28",
    title: "Banks steps down as CEO",
    summary:
      "Banks resigns as CEO amid accusations that fans were scammed through the MLG meme coin.",
    category: "controversy",
    memberSlugs: ["banks"],
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
  {
    id: "faze-vegas",
    date: "2025-09-19",
    title: "Atlanta FaZe becomes FaZe Vegas",
    summary: "FaZe's Call of Duty League team relocates from Atlanta to Las Vegas and is renamed FaZe Vegas.",
    category: "esports",
    sources: [
      { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" },
      { label: "Call of Duty Esports Wiki: FaZe Clan", url: "https://cod-esports.fandom.com/wiki/FaZe_Clan" },
    ],
  },
  {
    id: "core-formed",
    date: "2026-04-30",
    title: "Former FaZe creators form CORE",
    summary:
      "Stable Ronaldo, Adapt, Marlon, Lacy, JasonTheWeen and Silky launch a new group, CORE. Its YouTube channel is briefly taken down for automated security flags, then restored.",
    category: "creators",
    memberSlugs: ["jasontheween"],
    sources: [{ label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" }],
  },
];
