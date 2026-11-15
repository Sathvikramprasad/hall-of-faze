import type { VaultNote } from "./types";

// Historian reference notes: facts kept out of the public timeline because they
// are minor, lack an exact date, or conflict between sources. The Historian
// reads these alongside the timeline (see buildVaultContext in historian.ts).
// Write in your own words and keep uncertainty explicit.

const WIKI = { label: "Wikipedia: FaZe Clan", url: "https://en.wikipedia.org/wiki/FaZe_Clan" };
const MFT = { label: "My Favorite Things Wiki: FaZe Clan", url: "https://my-favorite-things.fandom.com/wiki/FaZe_Clan" };
const COD_EARNINGS = {
  label: "Esports Earnings: FaZe Clan (Call of Duty)",
  url: "https://www.esportsearnings.com/teams/240-faze-clan/results/301-call-of-duty",
};

export const vaultNotes: VaultNote[] = [
  // --- Founding and naming -------------------------------------------------
  {
    id: "note-founders-names",
    topic: "Founders",
    when: "2010",
    text:
      "FaZe was founded on May 30, 2010 as FaZe Sniping by Eric \"CLipZ\" Rivera, Jeff \"House Cat\" Emann and Ben \"Resistance\" Christensen. House Cat later went by \"Timid\". Some secondary sites mix up which real name belongs to House Cat and Resistance; Wikipedia's version is used here. Wikipedia's infobox lists the FaZe Sniping name as 2010–2011.",
    sources: [WIKI],
  },
  {
    id: "note-fakie",
    topic: "Early growth",
    when: "around 2010–2011 (exact join date not given)",
    text:
      "Wikipedia credits Ted \"Fakie\" joining with making FaZe's YouTube content take off; he left in 2014. His exact join date isn't given.",
    sources: [WIKI],
  },
  {
    id: "note-rug-join-year",
    topic: "Rug's join date",
    when: "2012 or January 2013",
    text:
      "Wikipedia's member table lists Rug as joining in 2012, while other coverage (used for the timeline) places it about six months after his channel started, in early 2013.",
    sources: [WIKI, MFT],
  },
  {
    id: "note-logo-history",
    topic: "Logos",
    text:
      "FaZe's own About page lists its main logos: the original FaZe Sniping/FaZe Clan logo (May 2010–Jan 2016), a short-lived transitional logo (Jan–Mar 2016), a third logo (Mar 2016–Aug 2018), a fourth (Aug 2018–Jun 2022), a fifth (Jun 2022–Dec 2024) and a sixth (Nov 2024–Jan 2025).",
    sources: [{ label: "FaZe Clan: About", url: "https://fazeclan.com/pages/about" }],
  },
  {
    id: "note-channel-facts",
    topic: "The FaZe Clan YouTube channel",
    when: "snapshot from the fan wiki, Oct 2023",
    text:
      "The fan wiki lists the main FaZe Clan channel as created May 30, 2010 and based in Sherman Oaks, California, with 8.57 million subscribers as of Oct 21, 2023. Its first upload was \"FaZe Sniping Intro\" and its most-viewed video is the 1 Million Subscribers Teamtage by FaZe MinK. The page lists \"Introducing FaZe Fortnite\" (2018) as the latest video, so that part of the page is out of date.",
    sources: [MFT],
  },
  {
    id: "note-member-stats",
    topic: "Creator roster and stats (fan wiki snapshot)",
    when: "fan wiki table, mostly around 2018–2019 with an Oct 2023 update for Banks",
    text:
      "Approximate total subscribers and views per member on the fan wiki: Rug 24.5M subs / 7.9B views (most subscribed and most viewed member); Apex 6M / 1.07B; Adapt 5.92M / 1.28B; Rain 5.33M / 1.07B; Jev 5.23M / 2.18B; Banks 5.02M / 411M; Blaze (also called \"FaZe Blaziken\") 3.66M / 873M; Teeqo 2.74M / 322M; Temperrr 2M / 79.2M; Agony 1.62M / 237M; Kay 1.0M / 112M; Nikan 906K; Swan 728K; Bloo 656K; Linkzy 628K; Fakie 517K; Jinx 408K; PryZee 380K; Sensei 378K; Replays 345K; Kitty 336K; CBass 331K; Dirty 319K; HugZ 203K; Testy 144K; ClipZ 94K; Hoppin 94K; GwidT 55K. The table says Apex, Rain, Adapt, Blaze and Nikan lived in the FaZe House at the time. These are old snapshots, not current numbers.",
    sources: [MFT],
  },
  {
    id: "note-roles",
    topic: "Who did what (fan wiki)",
    text:
      "Roles listed on the fan wiki: Temperrr founder/co-owner; Apex and Rain co-owners; Banks co-owner and CEO from Oct 20, 2023 (an older row also notes his time in RiceGum's \"Clout Gang\"); CBass clan manager; Barker lead montage editor, with Unchained, Pride and Jacob Klassen (\"FaZe PenG\", also a photographer) as montage editors; Nikan daily video editor; Zaibot head of FaZe Studio; Mito creative director; Coan graphics designer; JPEX graphics artist; Forceisdown (\"FaZe Force\") music relations; Hoppin CS:GO director; Sensei owner of FaZe Fitness. Testy joined on Christmas 2017. Most others are listed as trickshotters or personalities; ClipZ is marked as a founding member.",
    sources: [MFT],
  },
  {
    id: "note-past-members",
    topic: "Past members (fan wiki)",
    text:
      "The fan wiki's past-member list includes MinK (editor of the 1M teamtage), Faytal, Ninja, Pamaj, Barker, MeeK, Twistt, Ramos, Gumi, Stamina, Benji, PryZee, Jinx, House Cat, StyL, Mozey, HugZ, Karm, Zayzo, Medi, Sullys, Zimer, Matterr, Karma, Greggor, Cuban, Twist, SlasheR and SLP, plus rapper Chris Webby, Hoodie Allen and Logic. The real names that page gives for these members are not reliable (several share an unlikely surname, and House Cat's conflicts with Wikipedia), so they are not used here. Some names, such as Barker, PryZee and Jinx, appear in both the current and past lists, so the page mixes eras.",
    sources: [MFT],
  },

  // --- Call of Duty ----------------------------------------------------------
  {
    id: "note-mlg-columbus-2014",
    topic: "Call of Duty: first MLG title",
    when: "late 2014 (Advanced Warfare season; exact date not confirmed)",
    text:
      "FaZe won MLG Columbus, the first major Advanced Warfare event. It was the organization's first MLG championship and made Aches the winningest player in Call of Duty history at the time (19 titles). Afterwards the roster split into FaZe Red and FaZe Black for the 2015 Championship.",
    sources: [
      { label: "Fox Sports", url: "https://amp.foxsports.com/stories/other/blood-sweat-and-cheers-how-aches-became-g-o-a-t-of-call-of-duty" },
      { label: "Dot Esports", url: "https://dotesports.com/?p=22985" },
    ],
  },
  {
    id: "note-cod-2015-results",
    topic: "Call of Duty results 2015",
    when: "2015",
    text:
      "Other 2015 results: 2nd at UMG California and MLG Pro League Season 2 playoffs (Enable, SlasheR, Huke, ZooMaa); 1st at UMG Dallas (July 12, beating OpTic) and the Gfinity Summer Championship (early August) with Clayster, Enable, ZooMaa and Attach; 5th–6th at MLG World Finals.",
    sources: [COD_EARNINGS, { label: "TheSportsDB: FaZe Clan", url: "https://www.thesportsdb.com/team/136293" }],
  },
  {
    id: "note-cwl-2017-2019",
    topic: "Call of Duty World League results",
    when: "2017–2019",
    text:
      "CWL-era placements: 3rd at CWL Global Pro League 2017 Stage 1 ($92,500); 5th–6th at CWL Championship 2017; 1st at CWL Pro League 2018 Stage 1 ($212,500, on the timeline); 3rd at CWL Championship 2018 ($100,000); 3rd at CWL Pro League Finals 2019 ($200,000).",
    sources: [COD_EARNINGS],
  },
  {
    id: "note-atlanta-faze",
    topic: "Atlanta FaZe / FaZe Vegas",
    text:
      "Atlanta Esports Ventures bought a Call of Duty League slot on May 2, 2019 in partnership with FaZe; the team was announced Oct 26, 2019, lost the 2020 Champs final, won the 2021 Champs, and was renamed FaZe Vegas on Sep 19, 2025 after moving to Las Vegas. Wikipedia lists FaZe Vegas as 50% owned by FaZe.",
    sources: [WIKI, { label: "Call of Duty Esports Wiki: FaZe Clan", url: "https://cod-esports.fandom.com/wiki/FaZe_Clan" }],
  },

  // --- Counter-Strike --------------------------------------------------------
  {
    id: "note-csgo-2016-2018",
    topic: "Counter-Strike 2016–2018",
    text:
      "2016 was a building year (9th–12th at both MLG Columbus and ESL One Cologne). In 2017 FaZe won StarSeries Season 3, ESL One New York and ELEAGUE Premier, and was runner-up at IEM Oakland and ESL Pro League Season 6 Finals; it also won ECS Season 4 Finals. Wikipedia places the ELEAGUE Premier win in 2018 in one sentence, but its source and tournament coverage date it to October 2017.",
    sources: [
      WIKI,
      { label: "YouTube Wiki: FaZe Clan", url: "https://youtube.fandom.com/wiki/FaZe_Clan" },
      { label: "GosuGamers", url: "https://www.gosugamers.net/counterstrike/news/44725-esl-one-new-york-2017-faze-clan-are-the-third-invited-team" },
    ],
  },
  {
    id: "note-grand-slam-details",
    topic: "Intel Grand Slam IV",
    when: "Feb 2022 – Mar 26, 2023",
    text:
      "The four titles were IEM Katowice 2022 (3–0 vs G2), ESL Pro League Season 15 (3–1 vs ENCE), IEM Cologne 2022 (3–2 vs NAVI) and ESL Pro League Season 17 (vs Cloud9). FaZe missed earlier chances to finish it at the Rio Major, EPL Season 16 and IEM Katowice 2023. The prize was $1,000,000 (presented as gold bars) plus about $200,000 in event prize money. Twistzz became the first player to win two Grand Slams.",
    sources: [
      { label: "ESL", url: "https://esl.com/article/faze-clan-claim-intel-grand-slam-iv" },
      { label: "Seeking Alpha (FaZe press release)", url: "https://seekingalpha.com/pr/19235693-faze-clan-wins-intel-grand-slam-in-counter-strike-global-offensive-a-record-breaking" },
      { label: "Sportskhabri", url: "https://sportskhabri.com/?p=54106" },
    ],
  },
  {
    id: "note-cs2-2024",
    topic: "Counter-Strike 2 in 2024",
    when: "2024",
    text:
      "FaZe was runner-up to Team Spirit at IEM Katowice 2024 (0–3), runner-up to NAVI at the PGL Copenhagen Major (1–2, Mar 31), won IEM Chengdu, and was runner-up to Spirit at the Perfect World Shanghai Major (1–2, Dec 15). Shanghai was FaZe's third Major final loss overall (Boston 2018, Copenhagen 2024, Shanghai 2024); its one Major win is Antwerp 2022.",
    sources: [
      { label: "bo3.gg", url: "https://bo3.gg/articles/thye-end-of-the-faze-era-the-results-of-perfect-world-shanghai-major-2024" },
      { label: "Escorenews", url: "https://escorenews.com/en/csgo/news/57310-navi-wins-first-cs2-major-in-history-pgl-copenhagen-2024-over-faze-clan" },
    ],
  },

  // --- Other games -------------------------------------------------------------
  {
    id: "note-fortnite",
    topic: "Fortnite",
    when: "2018–2019",
    text:
      "FaZe's Fortnite division started Mar 3, 2018. In the 2018 Fall Skirmish, Tfue won the NA solo events in weeks 2 and 4 ($37,500 each) before winning the TwitchCon Grand Finals with Cloakzy on Oct 28: $400,000 for first plus $50,000 for a match win and $60,000 for most eliminations, about $510,000 for the duo. FunkBomb joined in December 2018. Tfue sued FaZe over his contract in May 2019, and FaZe countersued in August 2019.",
    sources: [
      { label: "Liquipedia: Tfue", url: "https://liquipedia.net/fortnite/Tfue" },
      { label: "Dexerto", url: "https://www.dexerto.com/fortnite/faze-clan-finally-add-funkbomb-to-fortnite-pro-ranks-249876" },
      { label: "GamesRadar", url: "https://www.gamesradar.com/who-is-tfue-fortnite-twitch-youtube" },
    ],
  },
  {
    id: "note-rainbow-six",
    topic: "Rainbow Six Siege",
    text:
      "FaZe's R6 team is an all-Brazilian roster; Handy has been on it since March 2023 and was MVP of the 2025 Six Invitational. Results: Six Invitational 2024 runner-up to w7m (2–3, $450,000); 2025 champion over Team BDS (3–1 in Boston, $1,000,000 from a $3,000,000 pool); 2026 champion over Team Secret (3–1 in Paris, another $1,000,000), the first back-to-back winner. SiegeGG named FaZe its Year 10 team of the year; FaZe and G2 are the only organizations with two Six Invitational titles.",
    sources: [
      { label: "SiegeGG: Year 10 team of the year", url: "https://siege.gg/lan/siegegg-year-10-awards-team-of-the-year-faze-clan" },
      { label: "bo3.gg", url: "https://bo3.gg/r6siege/news/best-of-the-best-the-top-pro-players-of-the-past-competitive-year-have-been-revealed" },
      { label: "Gamereactor", url: "https://www.gamereactor.eu/faze-clan-crowned-six-invitational-2026-champions-1675483/" },
    ],
  },
  {
    id: "note-other-divisions",
    topic: "Other esports divisions",
    text:
      "FaZe has also fielded teams in Overwatch (disbanded around February 2018, about $89,000 in winnings), PUBG (added in 2018), FIFA (players from January 2018), VALORANT (from June 25, 2020), Rocket League, Warzone and Super Smash Bros. Ultimate.",
    sources: [
      { label: "Liquipedia: FaZe Clan (Overwatch)", url: "https://liquipedia.net/overwatch/FaZe_Clan" },
      { label: "FIFA Esports Wiki: FaZe Clan", url: "https://fifa-esports.fandom.com/wiki/FaZe_Clan" },
      { label: "VALORANT Esports Wiki: FaZe Clan", url: "https://valorant-esports.fandom.com/wiki/FaZe_Clan" },
      { label: "Liquipedia: FaZe Clan (Warzone)", url: "https://liquipedia.net/callofduty/FaZe_Clan/Warzone" },
      { label: "SmashWiki: FaZe Clan", url: "https://www.ssbwiki.com/Team:FaZe_Clan" },
    ],
  },

  // --- Business, partnerships and money --------------------------------------
  {
    id: "note-partnerships",
    topic: "Brand partnerships and collabs",
    text:
      "Partners and collaborations listed on Wikipedia: G Fuel (since 2012), Champion (Nov 22, 2018), Siberia Hills (Mar 14, 2019), Nissan (Mar 21, 2019), ComplexCon booth (Jul 20, 2019), 24karats (Aug 16, 2019), New Era (Sep 17, 2019), Manchester City (Sep 26, 2019), Warren Lotas, Kappa and CLOT (Nov 2019), Lyrical Lemonade (Nov 27, 2019), McDonald's (Aug 2021), DC Comics (Sep 2021) and Nike (LeBron NXXT Gen, 2022–23). FaZe announced co-ownership of the supplement company CTRL on Jun 18, 2020.",
    sources: [WIKI],
  },
  {
    id: "note-investors",
    topic: "Series A and investors",
    when: "2019 (closing reported as Dec 2019; some sources say Apr 2020)",
    text:
      "FaZe's Series A was led by Jimmy Iovine and NTWRK; cited reports put it at about $40 million. Celebrity investors named on Wikipedia include Ray J, DJ Paul, Offset, Swae Lee, Yo Gotti, Pitbull, Meyers Leonard, Josh Hart, Ben Simmons, Jamal Murray, Gregory van der Wiel, Nyjah Huston, Big Boy, Sylvia Rhone, Troy Carter, Guy Oseary and Chris O'Donnell. In January 2020 FaZe took a $22.7M loan arranged with Canaccord Genuity as adviser.",
    sources: [WIKI],
  },
  {
    id: "note-valuations",
    topic: "Valuations and finances",
    text:
      "Forbes valued FaZe at $240M in 2019. In December 2020 it was reported worth $305M with estimated monthly revenue of $40M. The 2021 SPAC deal with B. Riley Principal 150 implied about $1B; FaZe listed on Jul 20, 2022 at roughly $725M. By Sep 2022 it had received only part of the expected $291M. The stock fell below $1 on Jan 20, 2023 ($0.76 by Feb 15), FaZe lost about $14M in the first half of 2023, and Nasdaq sent a delisting notice in March 2023. Some reports put GameSquare's all-stock purchase at about $17M (unconfirmed).",
    sources: [WIKI],
  },
  {
    id: "note-ownership-2024-2025",
    topic: "Ownership after GameSquare",
    when: "2024–2025",
    text:
      "After GameSquare's deal, Banks became CEO, Temperrr president and Yousef Abdelfattah COO. FaZe was one of 30 clubs in the Esports World Cup Club Support Program (May 6, 2024). FaZe Media was formed May 14, 2024 with Matt Kalish's Gigamoon Media investing $11M; Banks bought GameSquare's 25.5% stake on Jun 19, 2024, and GameSquare sold the rest on Mar 31, 2025, keeping FaZe Esports (Justin Kenna, president). FaZe Media was later shut down, leaving FaZe Esports as the operating company.",
    sources: [WIKI],
  },
  {
    id: "note-hardscope-ultimatum",
    topic: "December 2025 creator split (unverified details)",
    when: "Dec 26, 2025",
    text:
      "Bloomberg reported that Matt Kalish gave FaZe creators a choice to join HardScope or go independent. Some reports claimed a 20% revenue requirement; this hasn't been confirmed. Departures announced from Dec 25 include Adapt, JasonTheWeen, Lacy, Silky and Stable Ronaldo, then Apex, Swagg, YourRAGE, Kaysan and Rug; Kaysan stayed involved with FaZe Esports.",
    sources: [WIKI],
  },

  // --- Rosters by year ---------------------------------------------------------
  {
    id: "note-roster-changes",
    topic: "Who joined and left, by year",
    text:
      "From Wikipedia's member table (exact dates mostly not given): 2010 joined Temperrr. 2011 joined Apex, Rain, Teeqo (and Fakie). 2012 joined Rug; left CLipZ, Resistance. 2013 joined Adapt, Banks, Sensei, Kay. 2014 joined Jev; left Timid (House Cat), Fakie; RanbOw left FaZe France and was replaced by Toto. 2015 joined Blaze, Nikan, Censor. 2016 joined Replays, karrigan. 2018 joined Tfue, Boat. 2019 joined NICKMERCS, Sway, Jarvis; CLipZ rejoined; left Censor, karrigan, Tfue. 2020 joined Swagg, Bronny; CLipZ left again. 2021 joined K1, Scope, Kaysan, ZooMaa; Kay left. 2022 joined Stable Ronaldo, Snoop Dogg. 2023 joined YourRAGE, Bluefille; left Sensei, Jarvis. 2024 joined JasonTheWeen, Lacy, PlaqueBoyMax, Silky; left Teeqo, Rain, Blaze, Nikan, Sway, Bronny. 2025 left Temperrr, Banks, Jev, Replays, Boat, NICKMERCS, K1, Scope, ZooMaa and others, plus the December exodus. karrigan's FaZe CS career continued after 2019 (he returned and led the 2022 Major win); the table only records his first exit.",
    sources: [WIKI],
  },
  {
    id: "note-film-and-media",
    topic: "Film and media",
    when: "2020",
    text: "Rug starred in the 2020 film Crimson. FaZe's 1 million subscriber teamtage (Oct 2012) remains its most-watched video.",
    sources: [WIKI, { label: "Tubefilter", url: "https://www.tubefilter.com/2018/04/26/what-is-faze-clan-gaming-youtube-twitch/" }],
  },
];
