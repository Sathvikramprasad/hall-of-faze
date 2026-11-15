import mongoose, { Schema, type Model, type Types } from "mongoose";

export const EMAIL_CODE_PURPOSES = ["verify_email", "reset_password"] as const;
export type EmailCodePurpose = (typeof EMAIL_CODE_PURPOSES)[number];

/**
 * One active 6-digit code per account and purpose. Only a hash is stored.
 * Rows delete themselves when they expire.
 */
export interface IEmailCode {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  purpose: EmailCodePurpose;
  codeHash: string;
  attempts: number;
  sentAt: Date;
  expiresAt: Date;
}

const schema = new Schema<IEmailCode>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  purpose: { type: String, enum: EMAIL_CODE_PURPOSES, required: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, required: true, default: 0 },
  sentAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
});
schema.index({ userId: 1, purpose: 1 }, { unique: true, name: "one_code_per_user_purpose" });

const EmailCode: Model<IEmailCode> =
  (mongoose.models.EmailCode as Model<IEmailCode> | undefined) ?? mongoose.model<IEmailCode>("EmailCode", schema);

export default EmailCode;
