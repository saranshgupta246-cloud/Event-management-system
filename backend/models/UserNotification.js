import mongoose from "mongoose";

const NOTIFICATION_TYPES = [
  "application_status",
  "new_drive",
  "role_change",
  "new_application",
  "email_received",
];

const userNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userNotificationSchema.index({ userId: 1, createdAt: -1 });
userNotificationSchema.index({ userId: 1, isRead: 1 });

export const USER_NOTIFICATION_TYPES = NOTIFICATION_TYPES;
export default mongoose.model("UserNotification", userNotificationSchema);
