import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },
    role: {
      type: String,
      enum: ["member", "leader"],
      default: "member",
    },
    status: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

membershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });
membershipSchema.index({ clubId: 1, status: 1 });

export default mongoose.model("Membership", membershipSchema);
