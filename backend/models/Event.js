import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String, default: "" },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },
    eventDate: { type: Date, required: true },
    startTime: { type: String },
    endTime: { type: String },
    registrationStart: { type: Date, required: true },
    registrationEnd: { type: Date, required: true },
    location: { type: String },
    totalSeats: { type: Number, default: 0 },
    availableSeats: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    chatMode: {
      type: String,
      enum: ["leaders_only", "everyone"],
      default: "leaders_only",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

eventSchema.index({ eventDate: 1 });
eventSchema.index({ registrationStart: 1 });
eventSchema.index({ registrationEnd: 1 });
eventSchema.index({ clubId: 1 });

export default mongoose.model("Event", eventSchema);

