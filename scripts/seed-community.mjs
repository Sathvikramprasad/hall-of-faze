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
const challenge = {
  slug: "legacy-clutch-challenge-2026",
  title: "Legacy Clutch Challenge",
  description: "Submit your strongest clutch play and compete for a place in the November Hall of FaZe Top 3.",
  gameIds: ["counter-strike-2", "valorant", "call-of-duty"],
  rules: [
    "Submit footage that you created or have permission to use.",
    "Use one original gameplay clip and a custom thumbnail.",
    "The clip must pass moderation before it can receive votes.",
    "One authenticated fan may vote once per clip during this round.",
  ],
  eligibilitySummary: "Original gaming clips approved before the November voting deadline.",
  prizeSummary: "Demo recognition in the monthly Hall of FaZe Top 3.",
  sponsorName: null,
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
