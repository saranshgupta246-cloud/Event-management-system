import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["student", "club_leader", "faculty", "admin"],
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
      maxlength: 4000,
    },
    attachments: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

chatMessageSchema.index({ event: 1, createdAt: 1 });

export default mongoose.model("ChatMessage", chatMessageSchema);

