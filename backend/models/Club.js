import mongoose from "mongoose";

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    category: {
      type: String,
      enum: ["technical", "cultural", "sports", "literary", "other"],
      required: true,
    },
    logoUrl: { type: String },
    bannerUrl: { type: String },
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
clubSchema.index({ category: 1 });
clubSchema.index({ status: 1 });
clubSchema.index({ createdBy: 1 });

export default mongoose.model("Club", clubSchema);
