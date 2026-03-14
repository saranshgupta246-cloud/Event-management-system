import mongoose from "mongoose";

const roleHistoryEntrySchema = new mongoose.Schema(
  {
    fromRole: { type: String },
    toRole: { type: String, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String },
  },
  { _id: false }
);

const RANK_BY_CLUB_ROLE = {
  President: 1,
  Secretary: 2,
  Treasurer: 3,
  "Core Member": 4,
  Volunteer: 5,
  Member: 6,
};

const membershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clubId: { type: mongoose.Schema.Types.ObjectId, ref: "Club", required: true },
    role: {
      type: String,
      enum: ["member", "leader"],
      default: "member",
    },
    clubRole: {
      type: String,
      enum: ["President", "Secretary", "Treasurer", "Core Member", "Volunteer", "Member"],
      default: "Member",
    },
    roleRank: {
      type: Number,
      default: 6,
    },
    roleHistory: {
      type: [roleHistoryEntrySchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "inactive"],
      default: "pending",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

membershipSchema.pre("save", function (next) {
  if (this.clubRole && RANK_BY_CLUB_ROLE[this.clubRole] !== undefined) {
    this.roleRank = RANK_BY_CLUB_ROLE[this.clubRole];
  }
  next();
});

membershipSchema.index({ userId: 1, clubId: 1 }, { unique: true });
membershipSchema.index({ clubId: 1, status: 1 });

export default mongoose.model("Membership", membershipSchema);
