import mongoose from "mongoose";

if (!process.env.MONGODB_URI) {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // The explicit check below gives a clearer error than loadEnvFile.
  }
}

if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is missing. Add it to .env.local before seeding.");
  process.exit(1);
}

const now = new Date();
// Sponsored by "Voltline Energy", a FICTIONAL demo sponsor (see src/lib/sponsor.ts).
// The slug stays the same so existing links and votes keep working.
const challenge = {
  slug: "legacy-clutch-challenge-2026",
  title: "Voltline Energy Legacy Clutch Challenge",
  description:
    "Hit your cleanest clutch, upload it with a custom thumbnail, and let the community decide who makes the November Hall of FaZe Top 3.",
  gameIds: ["counter-strike-2", "valorant", "call-of-duty"],
  rules: [
    "Submit footage that you created or have permission to use.",
    "Enter one original gameplay clip per submission: up to 3 minutes and 250 MB (MP4, WebM or MOV), with a custom JPG, PNG or WebP thumbnail under 5 MB.",
    "Clips must come from Counter-Strike 2, VALORANT or Call of Duty.",
    "Every clip passes moderation before it appears or can receive votes. Moderators may reject or take down clips that break these rules.",
    "One signed-in fan may vote once per clip during this round. Bots, multiple accounts and vote trading are disqualified.",
    "Submissions and votes close at the deadline. Votes cast at or after the closing time do not count.",
    "Voltline Energy is a demo sponsor for this hackathon project. No purchase is necessary and no real prizes are awarded.",
  ],
  eligibilitySummary: "Original gaming clips approved before the November voting deadline.",
  prizeSummary: "Demo prizes: a Home page feature and a sponsor gear bundle for the Top 3.",
  sponsorName: "Voltline Energy",
  prizes: [
    { place: "1st", reward: "Featured on the Hall of FaZe Home page for a month, plus a Voltline Energy gear bundle (demo prize)." },
    { place: "2nd", reward: "Featured on the Next Up page for a month, plus a Voltline Energy gear bundle (demo prize)." },
    { place: "3rd", reward: "A shout-out in the monthly Top 3 recap (demo prize)." },
  ],
  howToWin: [],
  selectionPolicy: "community_vote",
  status: "active",
  roundKey: "2026-11",
  startsAt: new Date("2026-11-01T00:00:00.000Z"),
  endsAt: new Date("2026-12-01T00:00:00.000Z"),
  updatedAt: now,
};

try {
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: "hall_of_faze",
    serverSelectionTimeoutMS: 10_000,
  });
  const challenges = mongoose.connection.collection("challenges");
  await challenges.createIndex({ slug: 1 }, { unique: true });
  await challenges.createIndex({ status: 1, startsAt: 1, endsAt: 1 });
  const result = await challenges.updateOne(
    { slug: challenge.slug },
    {
      $set: challenge,
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
  console.log(result.upsertedCount ? "Created the demo challenge." : "Updated the demo challenge.");
} finally {
  await mongoose.disconnect();
}
