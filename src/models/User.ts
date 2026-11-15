import mongoose, { Schema, type Model, type Types } from "mongoose";
import type { Role, SocialLinks } from "@/types";

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  role: Role;
  socialLinks: SocialLinks;
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
  },
  { timestamps: true }
);

const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser> | undefined) ?? mongoose.model<IUser>("User", userSchema);

export default UserModel;
