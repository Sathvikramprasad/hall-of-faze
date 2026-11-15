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
