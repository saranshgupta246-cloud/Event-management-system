import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, default: "" },
    audience: {
      type: String,
      enum: ["all", "students", "faculty", "club_leaders"],
      default: "all",
    },
    pinned: { type: Boolean, default: false },
    // When set, this notification will be hidden after the given datetime
    expiresAt: { type: Date, default: null },
    // Allows manual \"deactivation\" without deleting the record
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ isActive: 1 });

export default mongoose.model("Notification", notificationSchema);
