import mongoose, { Schema, type Model, type Types } from "mongoose";
import type { Role, SocialLinks } from "@/types";

/** A Twitch or YouTube account the user proved they own by signing in there. */
export interface IConnections {
  twitch?: { id: string; login: string; displayName: string; verifiedAt: Date } | null;
  youtube?: { channelId: string; title: string; handle: string | null; verifiedAt: Date } | null;
}

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  role: Role;
  socialLinks: SocialLinks;
  /** Verified creator accounts ("Connect Twitch" / "Connect YouTube"). */
  connections?: IConnections;
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
    connections: {
      twitch: {
        type: new Schema(
          {
            id: { type: String, required: true },
            login: { type: String, required: true },
            displayName: { type: String, required: true },
            verifiedAt: { type: Date, required: true },
          },
          { _id: false },
        ),
        default: null,
      },
      youtube: {
        type: new Schema(
          {
            channelId: { type: String, required: true },
            title: { type: String, required: true },
            handle: { type: String, default: null },
            verifiedAt: { type: Date, required: true },
          },
          { _id: false },
        ),
        default: null,
      },
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
