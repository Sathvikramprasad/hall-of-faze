import mongoose, { Schema, type Model } from "mongoose";
import type { MemberProfile } from "@/lib/vault/types";

// Mongoose model for member profiles, for when Vault data moves into MongoDB.
// The pages currently read the static data in src/lib/vault/members.ts, so
// nothing imports this yet. Server-only: never import it from a client component.

const sourceSchema = new Schema(
  { label: { type: String, required: true }, url: { type: String, required: true } },
  { _id: false },
);

const videoSchema = new Schema(
  {
    youtubeId: { type: String, required: true },
    title: { type: String, required: true },
    credit: { type: String, required: true },
    year: Number,
  },
  { _id: false },
);

const memberProfileSchema = new Schema<MemberProfile>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    handle: { type: String, required: true },
    realName: String,
    role: { type: String, required: true },
    era: String,
    bio: { type: String, required: true },
    sources: {
      type: [sourceSchema],
      validate: {
        validator: (value: unknown[]) => value.length > 0,
        message: "A member profile needs at least one source.",
      },
    },
    videos: { type: [videoSchema], default: [] },
  },
  { timestamps: true },
);

export const MemberProfileModel: Model<MemberProfile> =
  (mongoose.models.MemberProfile as Model<MemberProfile> | undefined) ??
  mongoose.model<MemberProfile>("MemberProfile", memberProfileSchema);
