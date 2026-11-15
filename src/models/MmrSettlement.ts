import mongoose, { Schema, type Model } from "mongoose";

interface IMmrSettlement {
  challengeId: string;
  roundKey: string;
  participants: number;
  settledAt: Date;
}
const schema = new Schema<IMmrSettlement>({
  challengeId: { type: String, required: true },
  roundKey: { type: String, required: true },
  participants: { type: Number, required: true },
  settledAt: { type: Date, required: true },
});
schema.index({ challengeId: 1, roundKey: 1 }, { unique: true });
export default (mongoose.models.MmrSettlement as Model<IMmrSettlement> | undefined)
  ?? mongoose.model<IMmrSettlement>("MmrSettlement", schema);
