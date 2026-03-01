import mongoose from "mongoose";

const ROLE_RANK_MAP = {
  President: 1,
  Secretary: 2,
  Treasurer: 3,
  "Core Member": 4,
  Volunteer: 5,
  Member: 6,
};

const clubMemberSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: [
        "President",
        "Secretary",
        "Treasurer",
        "Core Member",
        "Volunteer",
        "Member",
      ],
      default: "Member",
    },
    roleRank: { type: Number },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    joinedAt: { type: Date, default: Date.now },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

clubMemberSchema.pre("save", function (next) {
  if (this.role && ROLE_RANK_MAP[this.role] !== undefined) {
    this.roleRank = ROLE_RANK_MAP[this.role];
  }
  next();
});

clubMemberSchema.index({ clubId: 1, userId: 1 }, { unique: true });
clubMemberSchema.index({ clubId: 1 });
clubMemberSchema.index({ userId: 1 });

export default mongoose.model("ClubMember", clubMemberSchema);
