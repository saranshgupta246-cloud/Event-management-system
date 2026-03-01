import mongoose from "mongoose";

const roleChangeLogSchema = new mongoose.Schema({
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Club",
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  fromRole: { type: String },
  toRole: { type: String },
  fromRank: { type: Number },
  toRank: { type: Number },
  reason: { type: String },
  changedAt: { type: Date, default: Date.now },
});

roleChangeLogSchema.index({ clubId: 1 });
roleChangeLogSchema.index({ targetUserId: 1 });
roleChangeLogSchema.index({ changedBy: 1 });
roleChangeLogSchema.index({ changedAt: 1 });

export default mongoose.model("RoleChangeLog", roleChangeLogSchema);
