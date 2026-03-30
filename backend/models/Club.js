import mongoose from "mongoose";
import { generateSlug, ensureUniqueClubSlug } from "../utils/generateSlug.js";

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, trim: true },
    description: { type: String },
    category: {
      type: String,
      enum: ["technical", "cultural", "sports", "literary", "other"],
      required: true,
    },
    logoUrl: { type: String },
    bannerUrl: { type: String },
    highlightsDriveUrl: { type: String, trim: true },
    websiteUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isOrphaned: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    coordinator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

clubSchema.index({ name: 1 }, { unique: true });
clubSchema.index({ slug: 1 }, { unique: true, sparse: true });
clubSchema.index({ category: 1 });
clubSchema.index({ status: 1 });
clubSchema.index({ createdBy: 1 });

clubSchema.pre("save", async function (next) {
  try {
    const nameChanged = this.isModified("name");
    const needsSlug = !this.slug || nameChanged;
    if (!needsSlug) return next();
    const base = generateSlug(this.name);
    const exclude = this._id ? { _id: { $ne: this._id } } : {};
    this.slug = await ensureUniqueClubSlug(this.constructor, base, exclude);
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Club", clubSchema);
