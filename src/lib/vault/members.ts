import type { MemberProfile } from "./types";

// Curated member profiles for the Vault.
//
// `channels` lists only channels confirmed to be the member's own (YouTube
// channel ids from vidIQ / Social Blade, Twitch logins from Streams Charts).
// They power live status and current YouTube stats on the profile page.
//
// `videos` is intentionally empty: add historical clips only when you can
// credit the channel that uploaded them (the profile page renders the credit
// line under each embed). Use the YouTube id, not the full URL.
//
// `currentRoster` marks who is on a FaZe roster today. Rosters move fast, so
// when you change one, bump ROSTER_AS_OF and keep the old member's profile:
// clear their `currentRoster`, close their `era` and add a line to their bio
// so they move to Past members.

/** The day the current rosters below were last checked (YYYY-MM-DD). */
export const ROSTER_AS_OF = "2026-11-15";

const wikipedia = {
  label: "Wikipedia: FaZe Clan",
  url: "https://en.wikipedia.org/wiki/FaZe_Clan",
};

const tubefilterGameSquare = {
  label: "Tubefilter",
  url: "https://tubefilter.com/2023/10/20/gamesquare-esports-acquires-faze-clan-banks-temperrr-apex-leadership/",
};

const banksStepsDown = {
  label: "Sheep Esports",
  url: "https://www.sheepesports.com/articles/faze-banks-steps-away-from-faze-clan-amid-crypto-allegations/en",
};

const banksCodStart = {
  label: "win.gg",
  url: "https://win.gg/news/who-is-faze-banks-and-how-did-he-become-famous-in-gaming/",
};

const ibtimesDecemberExits = {
  label: "International Business Times UK",
  url: "https://www.ibtimes.co.uk/faze-clan-loses-apex-rug-swagg-fans-fear-end-near-1766542",
};

const pglAntwerp = {
  label: "Wikipedia: PGL Major Antwerp 2022",
  url: "https://en.wikipedia.org/wiki/PGL_Major_Antwerp_2022",
};

const hltvFaze = { label: "HLTV: FaZe", url: "https://www.hltv.org/team/6667/faze" };

const ensigameFaze = {
  label: "Ensigame",
  url: "https://ensigame.com/teams/cs-2/faze-clan-faze",
};

const siegeggFaze = { label: "SiegeGG: FaZe Clan", url: "https://siege.gg/teams/50" };

const hotspawnEwc2026 = {
  label: "Hotspawn: EWC 2026",
  url: "https://www.hotspawn.com/?p=193447",
};

const nmeR6Roster2021 = {
  label: "NME",
  url: "https://www.nme.com/news/faze-clan-reveals-2021-rainbow-six-siege-roster-and-team-ambassador-2896128",
};

const siegeggHandyyKds = {
  label: "SiegeGG",
  url: "https://siege.gg/news/i-was-aligned-to-their-thoughts-and-playstyle-handyy-speaks-about-his-adaptation-to-faze-clan",
};

const liquipediaFazeVegas = {
  label: "Liquipedia: FaZe Vegas",
  url: "https://liquipedia.net/callofduty/FaZe_Vegas",
};

const codWikiFazeVegas = {
  label: "Call of Duty Esports Wiki: FaZe Vegas",
  url: "https://cod-esports.fandom.com/wiki/FaZe_Vegas",
};

export const memberProfiles: MemberProfile[] = [
  // ---- Today's rosters (as of ROSTER_AS_OF) ----

  // Counter-Strike 2
  {
    slug: "frozen",
    handle: "frozen",
    realName: "David Čerňanský",
    role: "Rifler",
    era: "2023–",
    currentRoster: "Counter-Strike 2",
    games: ["Counter-Strike 2"],
    bio: "A Slovak rifler who joined in December 2023 and stayed through the 2026 rebuild that followed karrigan's exit.",
    sources: [hltvFaze, ensigameFaze],
    videos: [],
  },
  {
    slug: "twistzz",
    handle: "Twistzz",
    realName: "Russel Van Dulken",
    role: "Rifler and in-game leader",
    era: "2021–2023, 2025–",
    currentRoster: "Counter-Strike 2",
    games: ["Counter-Strike 2"],
    bio: "A Canadian rifler who won the 2022 Antwerp Major with FaZe, spent two years at Team Liquid and came back in September 2025. He took over in-game leading when karrigan left in April 2026.",
    sources: [
      pglAntwerp,
      { label: "Critfeed", url: "https://critfeed.com/faze-clan-cs2/" },
      {
        label: "Dust2.us",
        url: "https://www.dust2.us/news/73000/media-neityu-to-stand-in-for-faze-twistzz-to-igl",
      },
    ],
    videos: [],
  },
  {
    slug: "jcobbb",
    handle: "jcobbb",
    realName: "Jakub Pietruszewski",
    role: "Rifler",
    era: "2025–",
    currentRoster: "Counter-Strike 2",
    games: ["Counter-Strike 2"],
    bio: "A Polish rifler who joined at the end of September 2025, weeks before FaZe's run to the grand final of the Budapest Major.",
    sources: [
      ensigameFaze,
      {
        label: "Insider Gaming",
        url: "https://insider-gaming.com/faze-still-has-something-to-play-for-this-season-frozen/",
      },
    ],
    videos: [],
  },
  {
    slug: "neityu",
    handle: "Neityu",
    realName: "Ryan Aubry",
    role: "Rifler",
    era: "2026–",
    currentRoster: "Counter-Strike 2",
    games: ["Counter-Strike 2"],
    bio: "A French rifler who stepped in from ENCE in April 2026 after karrigan's exit. FaZe made the move permanent that August.",
    sources: [
      {
        label: "Dust2.us",
        url: "https://www.dust2.us/news/73131/official-faze-confirm-neityu-as-stand-in",
      },
      {
        label: "esportnow.gg",
        url: "https://esportnow.gg/cs2/news/faze-counter-strike-officially-signs-stand-in-neityu-here-to-stay",
      },
    ],
    videos: [],
  },
  {
    slug: "jboen",
    handle: "JBOEN",
    realName: "Jason Boe Nielsen",
    role: "AWPer",
    era: "2026–",
    currentRoster: "Counter-Strike 2",
    games: ["Counter-Strike 2"],
    bio: "A Danish AWPer who joined from BIG Academy in June 2026, on a loan through the end of the year, after FaZe benched broky.",
    sources: [
      {
        label: "Dust2.us",
        url: "https://www.dust2.us/news/75399/official-faze-announce-jboen-to-replace-broky",
      },
      { label: "Dot Esports", url: "https://dotesports.com/counter-strike/news/faze-jboen-broky" },
      hltvFaze,
    ],
    videos: [],
  },

  // Rainbow Six Siege (Brazil)
  {
    slug: "vitaking",
    handle: "VITAKING",
    realName: "Victor Augusto dos Santos",
    role: "In-game leader",
    era: "2023–",
    currentRoster: "Rainbow Six Siege",
    games: ["Rainbow Six Siege"],
    bio: "Signed from Magic Squad just before the 2023 Six Invitational to replace cameram4n. He leads the roster that won the Six Invitational in 2025 and 2026 and the 2026 Esports World Cup.",
    sources: [
      {
        label: "SiegeGG",
        url: "https://siege.gg/news/faze-clan-replaces-cameram4n-with-magic-squad-player-vitaking",
      },
      { label: "Esports Charts", url: "https://escharts.com/teams/rainbow-6/faze" },
      hotspawnEwc2026,
    ],
    videos: [],
  },
  {
    slug: "handyy",
    handle: "Handyy",
    realName: "Thiago Sá Ferreira",
    role: "Player",
    era: "2023–",
    currentRoster: "Rainbow Six Siege",
    games: ["Rainbow Six Siege"],
    bio: "Came over from FURIA before the 2023 season after a single year as a pro. SiegeGG named him MVP of the 2025 Six Invitational, the first of FaZe's back-to-back world titles.",
    sources: [
      siegeggHandyyKds,
      { label: "SiegeGG: SI 2025 MVP", url: "https://siege.gg/na/six-invitational-2025-siegegg-mvp-handy" },
    ],
    videos: [],
  },
  {
    slug: "kds",
    handle: "KDS",
    realName: "Eduardo Chiste Fontes Santos",
    role: "Player",
    era: "2023–",
    currentRoster: "Rainbow Six Siege",
    games: ["Rainbow Six Siege"],
    bio: "Played for FaZe before the 2021 season, then rejoined alongside Handyy in 2023. After the 2026 Esports World Cup win he said he had finally won everything there is to win in Siege.",
    sources: [nmeR6Roster2021, siegeggHandyyKds, hotspawnEwc2026],
    videos: [],
  },
  {
    slug: "cyber",
    handle: "Cyber",
    realName: "Jaime Ramos",
    role: "Player",
    era: "2021–",
    currentRoster: "Rainbow Six Siege",
    games: ["Rainbow Six Siege"],
    bio: "Joined FaZe's Brazilian roster for the 2021 season. With the 2026 Esports World Cup title, he and soulz1 became the first players to win all three of Siege's biggest trophies with the same roster.",
    sources: [nmeR6Roster2021, hotspawnEwc2026, siegeggFaze],
    videos: [],
  },
  {
    slug: "soulz1",
    handle: "soulz1",
    realName: "Lucas Romero Schinke",
    role: "Player",
    era: "2021–",
    currentRoster: "Rainbow Six Siege",
    games: ["Rainbow Six Siege"],
    bio: "Arrived with Cyber for the 2021 season and has been part of every title since, including the back-to-back Six Invitationals and the 2026 Esports World Cup.",
    sources: [nmeR6Roster2021, hotspawnEwc2026, siegeggFaze],
    videos: [],
  },

  // Call of Duty (FaZe Vegas)
  {
    slug: "simp",
    handle: "FaZe Simp",
    realName: "Chris Lehr",
    role: "SMG, FaZe Vegas",
    era: "2020–",
    currentRoster: "Call of Duty",
    games: ["Call of Duty"],
    bio: "The last player left from Atlanta FaZe's original core. He was the CDL's season MVP in 2024 and 2025, and won world titles with FaZe in 2021 and 2026, the second after the team moved to Las Vegas.",
    sources: [
      { label: "Wikipedia: FaZe Vegas", url: "https://en.wikipedia.org/wiki/FaZe_Vegas" },
      {
        label: "Breaking Point",
        url: "https://lab.breakingpoint.gg/posts/sources-faze-eyeing-surge-duo-to-rebuild-around-simp-for-black-ops-7",
      },
      {
        label: "Dot Esports",
        url: "https://dotesports.com/call-of-duty/news/faze-vegas-win-cod-champs-2026-vs-optic-texas",
      },
    ],
    videos: [],
  },
  {
    slug: "scrap",
    handle: "FaZe Scrap",
    realName: "Thomas Ernst",
    role: "AR, FaZe Vegas",
    era: "2026–",
    currentRoster: "Call of Duty",
    games: ["Call of Duty"],
    bio: "Joined from the LA Thieves in October 2026 as FaZe Vegas rebuilt its title-winning roster for the Modern Warfare 4 season.",
    sources: [
      liquipediaFazeVegas,
      codWikiFazeVegas,
      { label: "100 Thieves", url: "https://100thieves.com/blogs/all/la-thieves-2026-roster" },
    ],
    videos: [],
  },
  {
    slug: "hydra",
    handle: "FaZe HyDra",
    realName: "Paco Rusiewiez",
    role: "SMG, FaZe Vegas",
    era: "2026–",
    currentRoster: "Call of Duty",
    games: ["Call of Duty"],
    bio: "Signed from the LA Thieves alongside Scrap in October 2026, joining Simp as one of the team's two SMG players.",
    sources: [
      liquipediaFazeVegas,
      codWikiFazeVegas,
      { label: "100 Thieves", url: "https://100thieves.com/blogs/all/la-thieves-2026-roster" },
    ],
    videos: [],
  },
  {
    slug: "alluka",
    handle: "FaZe Alluka",
    realName: "Mohammed Bindal",
    role: "Flex, FaZe Vegas",
    era: "2025–",
    currentRoster: "Call of Duty",
    games: ["Call of Duty"],
    bio: "Signed as a substitute in late 2025 after a strong Challengers run. FaZe loaned him to the Riyadh Falcons for Champs 2026, where they finished third, then brought him back as a starter in October 2026.",
    sources: [
      { label: "Breaking Point", url: "https://breakingpoint.gg/posts/1343" },
      liquipediaFazeVegas,
      {
        label: "Field Level Media",
        url: "https://fieldlevelmedia.com/esports/faze-vegas-wont-be-denied-at-cdl-championship-grand-final/",
      },
    ],
    videos: [],
  },

  // Content
  {
    slug: "zoomaa",
    handle: "FaZe ZooMaa",
    realName: "Thomas Paparatto",
    role: "Content creator; host of The Flank",
    era: "Rejoined 2021",
    currentRoster: "Content",
    games: ["Call of Duty"],
    bio: "A former FaZe Call of Duty pro who came back as a content creator in 2021. After the December 2025 exits he was the last creator still repping FaZe, and in November 2026 FaZe teamed up with his show, The Flank, on a $100,000 Call of Duty invitational.",
    sources: [
      {
        label: "Tubefilter",
        url: "https://www.tubefilter.com/2021/11/04/retired-call-of-duty-pro-zoomaa-re-enters-faze-clan-fold/amp/",
      },
      { label: "win.gg", url: "https://win.gg/faze-streamer-leaves-jev-rebrand/" },
      {
        label: "RG.org",
        url: "https://rg.org/news/esports/faze-clan-11-11-26-teaser-100000-flank-invitational-zoomaa-mw4",
      },
    ],
    channels: { twitch: "zoomaa" },
    videos: [],
  },

  // ---- Past members: founders and former members ----

  {
    slug: "clipz",
    handle: "FaZe CLipZ",
    realName: "Eric Rivera",
    role: "Co-founder",
    era: "2010",
    games: ["Call of Duty"],
    bio: "One of the three Call of Duty players behind FaZe Sniping's first Modern Warfare 2 trickshot videos in 2010.",
    sources: [wikipedia],
    videos: [],
  },
  {
    slug: "housecat",
    handle: "FaZe House Cat",
    realName: "Jeff Emann",
    role: "Co-founder",
    era: "2010",
    games: ["Call of Duty"],
    bio: "Co-founded FaZe Sniping in 2010 alongside CLipZ and Resistance. He later went by the name \"Timid.\"",
    sources: [wikipedia],
    videos: [],
  },
  {
    slug: "resistance",
    handle: "FaZe Resistance",
    realName: "Ben Christensen",
    role: "Co-founder",
    era: "2010",
    games: ["Call of Duty"],
    bio: "The third founding member of FaZe Sniping, part of the trio credited with pushing trickshotting forward in Modern Warfare 2.",
    sources: [wikipedia],
    videos: [],
  },
  {
    slug: "banks",
    handle: "FaZe Banks",
    realName: "Richard Bengtson",
    role: "Longtime leader; CEO after the GameSquare deal",
    era: "Until 2025",
    games: ["Call of Duty"],
    bio: "Long one of FaZe's most visible figures. He returned as CEO when GameSquare bought the company, led the 2024 roster reboot and stepped down as CEO in July 2025.",
    sources: [banksStepsDown, banksCodStart, tubefilterGameSquare, wikipedia],
    channels: { twitch: "fazebanks", youtubeHandle: "@bankshasbank" },
    videos: [],
  },
  {
    slug: "temperrr",
    handle: "FaZe Temperrr",
    realName: "Thomas Oliveira",
    role: "Trickshot pioneer; President after the GameSquare deal",
    era: "Until 2025",
    games: ["Call of Duty"],
    bio: "An early trickshot innovator who came back to run FaZe as President under GameSquare's ownership. FaZe left him off its updated roster in September 2025.",
    sources: [
      tubefilterGameSquare,
      {
        label: "ShaneTheGamer",
        url: "https://www.shanethegamer.com/esports-news/faze-clan-temperrr-rain-controversy/",
      },
    ],
    videos: [],
  },
  {
    slug: "apex",
    handle: "FaZe Apex",
    realName: "Yousef Abdelfattah",
    role: "Original member; returned to leadership in 2024",
    era: "2011–2025",
    games: ["Call of Duty"],
    bio: "One of the original members GameSquare brought back to lead the brand alongside Banks and Temperrr. On December 27, 2025 he announced he was closing his FaZe chapter after nearly 15 years.",
    sources: [
      ibtimesDecemberExits,
      tubefilterGameSquare,
      {
        label: "GameSquare investor news",
        url: "https://investors.gamesquare.com/news/news-details/2024/GameSquare-Announces-Completion-of-Faze-Clan-Acquisition/",
      },
    ],
    channels: { twitch: "fazeapex", youtubeChannelId: "UCa7507M549AiDKN8J89tn5A" },
    videos: [],
  },
  {
    slug: "rug",
    handle: "FaZe Rug",
    realName: "Brian Awadis",
    role: "YouTuber; FaZe's biggest individual channel",
    era: "2013–2025",
    games: ["Call of Duty"],
    bio: "Joined in January 2013, six months after starting his YouTube channel, and grew into FaZe's biggest individual YouTuber. He was on the 2021 Sports Illustrated cover and announced he had left FaZe in December 2025.",
    sources: [
      { label: "Wikipedia: FaZe Rug", url: "https://en.wikipedia.org/wiki/FaZe_Rug" },
      {
        label: "Complex",
        url: "https://www.complex.com/pop-culture/a/taffeta-chime/faze-clan-streaming-twitch-youtube-explainer",
      },
    ],
    channels: { twitch: "rug", youtubeChannelId: "UCilwZiBBfI9X6yiZRzWty8Q" },
    videos: [],
  },
  {
    slug: "swagg",
    handle: "FaZe Swagg",
    realName: "Kris Lamberson",
    role: "Warzone streamer; Nuke Squad",
    era: "2020–2025",
    games: ["Call of Duty"],
    bio: "A Call of Duty YouTuber who earned his spot in April 2020 by answering FaZe's April Fools open call. He became one of the top Warzone streamers, brought his Nuke Squad friends into FaZe, and was on the 2021 Sports Illustrated cover. He announced his departure in late December 2025.",
    sources: [
      ibtimesDecemberExits,
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
    channels: { twitch: "swagg", youtubeChannelId: "UCW1CGYCjfKhNLGp_Os1g_Pg" },
    videos: [],
  },
  {
    slug: "snoop",
    handle: "FaZe Snoop",
    realName: "Calvin Broadus Jr. (Snoop Dogg)",
    role: "Roster member; board member 2022–2023",
    era: "Joined 2022",
    games: ["Madden NFL", "NBA 2K"],
    bio: "Snoop Dogg joined FaZe twice over in March 2022: as a member of its talent roster and, once the company went public, with a seat on its board of directors. He resigned from the board in March 2023, and FaZe said its multi-year collaboration with him would continue.",
    sources: [
      {
        label: "The Hollywood Reporter",
        url: "https://www.hollywoodreporter.com/business/digital/snoop-dogg-joins-faze-clan-talent-network-board-of-directors-1235103724/",
      },
      {
        label: "esports.gg",
        url: "https://esports.gg/news/streamers/faze-the-fk-up-rapper-snoop-dogg-officially-becomes-faze-snoop-yes-for-real/",
      },
      { label: "ESTNN", url: "https://estnn.com/snoop-dogg-joins-faze-clans-board-of-directors" },
      {
        label: "Music Business Worldwide",
        url: "https://www.musicbusinessworldwide.com/snoop-dogg-exits-faze-clan-board-as-firms-stock-plunges-to-lowest-since-ipo1/",
      },
    ],
    videos: [],
  },
  {
    slug: "karrigan",
    handle: "karrigan",
    realName: "Finn Andersen",
    role: "CS in-game leader",
    era: "2016–2019, 2021–2026",
    games: ["CS:GO", "Counter-Strike 2"],
    bio: "Captained FaZe's CS:GO roster to the 2022 PGL Major Antwerp title, the first Major won by a fully international lineup. He left for Team Falcons in April 2026.",
    sources: [
      {
        label: "AFK Gaming",
        url: "https://afkgaming.com/csgo/news/faze-clan-defeats-navi-to-win-pgl-antwerp-major-2022",
      },
      pglAntwerp,
      { label: "Wikipedia: Karrigan", url: "https://en.wikipedia.org/wiki/Karrigan" },
    ],
    videos: [],
  },
  {
    slug: "jasontheween",
    handle: "JasonTheWeen",
    realName: "Jason Nguyen",
    role: "Streamer",
    era: "2024–2025",
    bio: "A Twitch streamer who joined days after the April 2024 reboot and left alongside several other creators in December 2025.",
    sources: [
      {
        label: "Dexerto",
        url: "https://www.dexerto.com/twitch/faze-clan-full-roster-2676401/",
      },
      {
        label: "International Business Times UK",
        url: "https://www.ibtimes.co.uk/faze-clan-hit-major-exits-stable-ronaldo-silky-lacy-jasontheween-leave-1765943",
      },
    ],
    channels: { twitch: "jasontheween", youtubeChannelId: "UCxoKaKMzulp6sfQGOhNJnzQ" },
    videos: [],
  },
];
