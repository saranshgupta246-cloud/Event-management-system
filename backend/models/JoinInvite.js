import mongoose from "mongoose";

const joinInviteSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    source: {
      type: String,
      enum: ["leader_invite", "recruitment_selection"],
      default: "recruitment_selection",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "used", "revoked", "expired"],
      default: "pending",
      index: true,
    },
    role: {
      type: String,
      default: "Member",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    usedAt: {
      type: Date,
    },
    usedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

joinInviteSchema.index({ clubId: 1, email: 1, status: 1 });
joinInviteSchema.index({ applicationId: 1 });
joinInviteSchema.index({ applicantId: 1 });

export default mongoose.model("JoinInvite", joinInviteSchema);

