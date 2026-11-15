import mongoose, { Schema, type Model, type Types } from "mongoose";
import { isVotingRoundKey } from "@/lib/community-rules";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export interface IVote {
  _id: Types.ObjectId;
  voterId: string;
  clipId: string;
  challengeId: string;
  votingRound: string;
  createdAt: Date;
}

const VoteSchema = new Schema<IVote>(
  {
    voterId: { type: String, required: true, match: OBJECT_ID_PATTERN },
    clipId: { type: String, required: true, match: OBJECT_ID_PATTERN },
    challengeId: { type: String, required: true, match: OBJECT_ID_PATTERN },
    votingRound: {
      type: String,
      required: true,
      validate: { validator: isVotingRoundKey, message: "votingRound must use YYYY-MM." },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// The database, not a client-side check, is the final duplicate-vote guard.
VoteSchema.index(
  { voterId: 1, clipId: 1, challengeId: 1, votingRound: 1 },
  { unique: true, name: "one_vote_per_user_clip_round" },
);
VoteSchema.index({ challengeId: 1, votingRound: 1, clipId: 1 });

const Vote: Model<IVote> =
  (mongoose.models.Vote as Model<IVote> | undefined) ?? mongoose.model<IVote>("Vote", VoteSchema);

export default Vote;
