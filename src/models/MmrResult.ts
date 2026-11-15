import mongoose, { Schema, type Model, type Types } from "mongoose";
export interface IMmrResult {
  _id: Types.ObjectId; challengeId: string; roundKey: string; userId: string;
  place: number; participants: number; votes: number; topVotes: number;
  delta: number; awardedAt: Date; challengeTitle: string;
  sponsorName: string | null; badgeColor: string | null; badgeIcon: string | null;
}
const schema = new Schema<IMmrResult>({
  challengeId: { type: String, required: true }, roundKey: { type: String, required: true },
  userId: { type: String, required: true }, place: { type: Number, required: true },
  participants: { type: Number, required: true }, votes: { type: Number, required: true },
  topVotes: { type: Number, required: true }, delta: { type: Number, required: true },
  awardedAt: { type: Date, required: true }, challengeTitle: { type: String, required: true },
  sponsorName: { type: String, default: null }, badgeColor: { type: String, default: null },
  badgeIcon: { type: String, default: null },
}, { timestamps: false });
schema.index({ challengeId: 1, roundKey: 1, userId: 1 }, { unique: true });
schema.index({ userId: 1, awardedAt: 1 });
export default (mongoose.models.MmrResult as Model<IMmrResult> | undefined) ?? mongoose.model<IMmrResult>("MmrResult", schema);
