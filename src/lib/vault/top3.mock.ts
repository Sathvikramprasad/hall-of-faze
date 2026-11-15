import type { MonthlyTop3Entry } from "./types";

// MOCK DATA — replace with the shared Top 3 API once the backend branch
// exposes it. Keep the function signature so the Home page doesn't change:
// swap the body for a fetch (or DB call) and map the response to
// MonthlyTop3Entry. Field names here are a guess; align them with the API.

export type MonthlyTop3 = {
  monthLabel: string;
  isMock: boolean;
  entries: MonthlyTop3Entry[];
};

export async function getMonthlyTop3(): Promise<MonthlyTop3> {
  return {
    monthLabel: "This month",
    isMock: true,
    entries: [
      {
        rank: 1,
        title: "Sample clip: 360 no-scope recreation",
        creator: "Sample Creator A",
        category: "Legacy Challenge",
        votes: 1280,
      },
      {
        rank: 2,
        title: "Sample stream: Vault watch-along",
        creator: "Sample Creator B",
        category: "Stream",
        votes: 940,
      },
      {
        rank: 3,
        title: "Sample edit: 2010 montage tribute",
        creator: "Sample Creator C",
        category: "Edit",
        votes: 610,
      },
    ],
  };
}
