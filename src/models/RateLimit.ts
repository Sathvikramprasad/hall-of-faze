import mongoose, { Schema, type Model } from "mongoose";

export interface IRateLimit {
  _id: string;
  scope: string;
  attempts: number;
  windowStartedAt: Date;
  expiresAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>(
  {
    _id: { type: String, required: true },
    scope: { type: String, required: true },
    attempts: { type: Number, required: true, min: 1 },
    windowStartedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit: Model<IRateLimit> =
  (mongoose.models.RateLimit as Model<IRateLimit> | undefined) ??
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);

export default RateLimit;
