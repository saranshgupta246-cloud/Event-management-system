import mongoose from "mongoose";

const notificationReadSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notificationId: { type: mongoose.Schema.Types.ObjectId, ref: "Notification", required: true },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

notificationReadSchema.index({ userId: 1, notificationId: 1 }, { unique: true });

export default mongoose.model("NotificationRead", notificationReadSchema);
