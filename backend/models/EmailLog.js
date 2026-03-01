import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema({
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
    required: true,
  },
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Club",
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  recipientEmail: { type: String },
  recipientName: { type: String },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  templateUsed: {
    type: String,
    enum: ["shortlist", "interview", "rejection", "offer", "custom"],
  },
  sentAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["sent", "failed"],
    default: "sent",
  },
});

emailLogSchema.index({ applicationId: 1 });
emailLogSchema.index({ clubId: 1 });
emailLogSchema.index({ sentBy: 1 });
emailLogSchema.index({ sentAt: 1 });

export default mongoose.model("EmailLog", emailLogSchema);
