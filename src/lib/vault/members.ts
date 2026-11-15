import type { MemberProfile } from "./types";

// Curated member profiles for the Vault.
//
// `videos` is intentionally empty: add historical clips only when you can
// credit the channel that uploaded them (the profile page renders the credit
// line under each embed). Use the YouTube id, not the full URL.

const wikipedia = {
  label: "Wikipedia: FaZe Clan",
  url: "https://en.wikipedia.org/wiki/FaZe_Clan",
};

const tubefilterGameSquare = {
  label: "Tubefilter",
  url: "https://tubefilter.com/2023/10/20/gamesquare-esports-acquires-faze-clan-banks-temperrr-apex-leadership/",
};

export const memberProfiles: MemberProfile[] = [
  {
    slug: "clipz",
    handle: "FaZe CLipZ",
    realName: "Eric Rivera",
    role: "Co-founder",
    era: "2010",
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
    bio: "The third founding member of FaZe Sniping, part of the trio credited with pushing trickshotting forward in Modern Warfare 2.",
    sources: [wikipedia],
    videos: [],
  },
  {
    slug: "banks",
    handle: "FaZe Banks",
    realName: "Richard Bengtson",
    role: "Longtime leader; CEO after the GameSquare deal",
    bio: "Long one of FaZe's most visible figures. He returned as CEO when GameSquare bought the company and led the 2024 roster reboot.",
    sources: [tubefilterGameSquare, wikipedia],
    videos: [],
  },
  {
    slug: "temperrr",
    handle: "FaZe Temperrr",
    realName: "Thomas Oliveira",
    role: "Trickshot pioneer; President after the GameSquare deal",
    bio: "An early trickshot innovator who came back to run FaZe as President under GameSquare's ownership.",
    sources: [tubefilterGameSquare],
    videos: [],
  },
  {
    slug: "apex",
    handle: "FaZe Apex",
    realName: "Yousef Abdelfattah",
    role: "Original member; returned to leadership in 2024",
    bio: "One of the original members GameSquare brought back to lead the brand alongside Banks and Temperrr.",
    sources: [
      tubefilterGameSquare,
      {
        label: "GameSquare investor news",
        url: "https://investors.gamesquare.com/news/news-details/2024/GameSquare-Announces-Completion-of-Faze-Clan-Acquisition/",
      },
    ],
    videos: [],
  },
  {
    slug: "rug",
    handle: "FaZe Rug",
    realName: "Brian Awadis",
    role: "YouTuber; FaZe's biggest individual channel",
    era: "2013–2025",
    bio: "Joined in January 2013, six months after starting his YouTube channel, and grew into FaZe's biggest individual YouTuber. He was on the 2021 Sports Illustrated cover and announced he had left FaZe in December 2025.",
    sources: [
      { label: "Wikipedia: FaZe Rug", url: "https://en.wikipedia.org/wiki/FaZe_Rug" },
      {
        label: "Complex",
        url: "https://www.complex.com/pop-culture/a/taffeta-chime/faze-clan-streaming-twitch-youtube-explainer",
      },
    ],
    videos: [],
  },
  {
    slug: "swagg",
    handle: "FaZe Swagg",
    realName: "Kris Lamberson",
    role: "Warzone streamer; Nuke Squad",
    era: "Joined 2020",
    bio: "A Call of Duty YouTuber who earned his spot in April 2020 by answering FaZe's April Fools open call. He became one of the top Warzone streamers, brought his Nuke Squad friends into FaZe, and was on the 2021 Sports Illustrated cover.",
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
    videos: [],
  },
  {
    slug: "snoop",
    handle: "FaZe Snoop",
    realName: "Calvin Broadus Jr. (Snoop Dogg)",
    role: "Roster member and board member",
    era: "Joined 2022",
    bio: "Snoop Dogg joined FaZe twice over in March 2022: as a member of its talent roster and, once the company went public, with a seat on its board of directors.",
    sources: [
      {
        label: "The Hollywood Reporter",
        url: "https://www.hollywoodreporter.com/business/digital/snoop-dogg-joins-faze-clan-talent-network-board-of-directors-1235103724/",
      },
    ],
    videos: [],
  },
  {
    slug: "karrigan",
    handle: "karrigan",
    realName: "Finn Andersen",
    role: "CS in-game leader",
    bio: "Captained FaZe's CS:GO roster to the 2022 PGL Major Antwerp title, the first Major won by a fully international lineup.",
    sources: [
      {
        label: "AFK Gaming",
        url: "https://afkgaming.com/csgo/news/faze-clan-defeats-navi-to-win-pgl-antwerp-major-2022",
      },
      {
        label: "Wikipedia: PGL Major Antwerp 2022",
        url: "https://en.wikipedia.org/wiki/PGL_Major_Antwerp_2022",
      },
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
    videos: [],
  },
];
