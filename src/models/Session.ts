import mongoose, { Schema, type Model, type Types } from "mongoose";

export interface ISession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const SessionModel: Model<ISession> =
  (mongoose.models.Session as Model<ISession> | undefined) ??
  mongoose.model<ISession>("Session", sessionSchema);

export default SessionModel;
