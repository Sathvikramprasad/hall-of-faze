import mongoose, { Schema, type Model, type Types } from "mongoose";
import type { Role, SocialLinks } from "@/types";

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  role: Role;
  socialLinks: SocialLinks;
  /**
   * False until the emailed code is entered. Accounts created before email
   * verification existed have no value and are treated as verified.
   */
  emailVerified?: boolean;
  emailVerifiedAt?: Date | null;
  /** Private storage key of the profile picture, or null for the letter avatar. */
  avatarKey?: string | null;
  avatarContentType?: string | null;
  /** Bumped on every change so browsers fetch the new picture. */
  avatarVersion?: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    role: { type: String, enum: ["user", "moderator"], required: true, default: "user" },
    socialLinks: {
      twitch: { type: String },
      youtube: { type: String },
    },
    emailVerified: { type: Boolean },
    emailVerifiedAt: { type: Date, default: null },
    avatarKey: { type: String, default: null },
    avatarContentType: { type: String, default: null },
    avatarVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ?? mongoose.model<IUser>("User", userSchema);

export default UserModel;
