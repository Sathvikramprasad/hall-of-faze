import mongoose, { Schema, type Model, type Types } from "mongoose";
import { CHALLENGE_STATUSES, type ChallengeStatus, isVotingRoundKey } from "@/lib/community-rules";

export interface IChallenge {
  _id: Types.ObjectId;
  slug: string;
  title: string;
  description: string;
  gameIds: string[];
  rules: string[];
  eligibilitySummary: string;
  prizeSummary: string;
  sponsorName: string | null;
  selectionPolicy: "community_vote";
  status: ChallengeStatus;
  roundKey: string;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChallengeSchema = new Schema<IChallenge>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 80,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 1_000 },
    gameIds: { type: [String], default: [] },
    rules: { type: [String], default: [] },
    eligibilitySummary: { type: String, required: true, trim: true, maxlength: 500 },
    prizeSummary: { type: String, default: "", trim: true, maxlength: 500 },
    sponsorName: { type: String, default: null, trim: true, maxlength: 120 },
    selectionPolicy: { type: String, enum: ["community_vote"], default: "community_vote" },
    status: { type: String, enum: CHALLENGE_STATUSES, required: true, default: "draft" },
    roundKey: {
      type: String,
      required: true,
      validate: { validator: isVotingRoundKey, message: "roundKey must use YYYY-MM." },
    },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
  },
  { timestamps: true },
);

ChallengeSchema.pre("validate", function validateWindow() {
  if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) {
    this.invalidate("endsAt", "endsAt must be later than startsAt.");
  }
});

ChallengeSchema.index({ status: 1, startsAt: 1, endsAt: 1 });
ChallengeSchema.index({ roundKey: 1, status: 1 });

const Challenge: Model<IChallenge> =
  (mongoose.models.Challenge as Model<IChallenge> | undefined) ??
  mongoose.model<IChallenge>("Challenge", ChallengeSchema);

export default Challenge;
