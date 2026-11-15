import type { VaultStat } from "./types";

// Dated subscriber counts for the official FaZe Clan YouTube channel, shown as
// compact markers inside each year of the timeline.
//
// Only add a number when a source states it for a specific date. Exact days
// the channel crossed each million mostly weren't reported, so this list uses
// counts that were published, not estimated crossing dates.

export const vaultStats: VaultStat[] = [
  {
    id: "subs-2012",
    date: "2012-01-01",
    datePrecision: "year",
    value: "1M",
    label: "YouTube subscribers",
    note: "Two years after launch",
    sources: [
      {
        label: "Tubefilter",
        url: "https://www.tubefilter.com/2018/04/26/what-is-faze-clan-gaming-youtube-twitch/",
      },
    ],
  },
  {
    id: "subs-2016-guinness",
    date: "2016-02-04",
    value: "3.63M",
    label: "YouTube subscribers",
    note: "Guinness World Record: most-subscribed esports team channel",
    sources: [
      {
        label: "Guinness World Records",
        url: "https://www.guinnessworldrecords.com/world-records/412620-most-subscribed-youtube-channel-by-an-esports-team",
      },
    ],
  },
  {
    id: "subs-2018",
    date: "2018-12-19",
    value: "5.6M",
    label: "YouTube subscribers",
    note: "Nearly, as Lil Yachty joins as FaZe Boat",
    sources: [
      {
        label: "Tubefilter",
        url: "https://tubefilter.com/2018/12/19/faze-clan-lil-yachty-faze-boat-youtube/",
      },
    ],
  },
];
