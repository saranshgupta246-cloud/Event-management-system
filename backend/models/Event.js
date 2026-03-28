import mongoose from "mongoose";
import { generateSlug, ensureUniqueEventSlug } from "../utils/generateSlug.js";

const REG_TYPES = ["solo", "duo", "squad"];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, trim: true },
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
    registrationTypes: {
      type: [{ type: String, enum: REG_TYPES }],
      default: ["solo"],
    },
    fees: {
      solo: { type: Number, default: 0 },
      duo: { type: Number, default: 0 },
      squad: { type: Number, default: 0 },
    },
    isFree: {
      solo: { type: Boolean, default: true },
      duo: { type: Boolean, default: true },
      squad: { type: Boolean, default: true },
    },
    teamSize: {
      min: { type: Number, default: 2 },
      max: { type: Number, default: 5 },
    },
    upiId: { type: String, default: "" },
    upiQrImageUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    isRecommended: { type: Boolean, default: false },
    isWorkshop: { type: Boolean, default: false },
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
    meritTemplateUrl: { type: String, default: "" },
    participationTemplateUrl: { type: String, default: "" },
    certificateCoords: {
      nameX: { type: Number, default: 200 },
      nameY: { type: Number, default: 400 },
      eventX: { type: Number, default: 200 },
      eventY: { type: Number, default: 350 },
      dateX: { type: Number, default: 200 },
      dateY: { type: Number, default: 300 },
      positionX: { type: Number, default: 200 },
      positionY: { type: Number, default: 250 },
      fontSize: { type: Number, default: 24 },
    },
  },
  { timestamps: true }
);

eventSchema.index({ eventDate: 1 });
eventSchema.index({ registrationStart: 1 });
eventSchema.index({ registrationEnd: 1 });
eventSchema.index({ clubId: 1 });
eventSchema.index({ slug: 1 }, { unique: true, sparse: true });

eventSchema.pre("save", async function (next) {
  try {
    const titleChanged = this.isModified("title");
    const needsSlug = !this.slug || titleChanged;
    if (!needsSlug) return next();
    const base = generateSlug(this.title) || "event";
    const exclude = this._id ? { _id: { $ne: this._id } } : {};
    this.slug = await ensureUniqueEventSlug(this.constructor, base, exclude);
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Event", eventSchema);
export { REG_TYPES };
