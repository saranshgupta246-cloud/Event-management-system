import mongoose from "mongoose";

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    category: {
      type: String,
      enum: ["Technical", "Cultural", "Sports", "Marketing"],
      required: true,
    },
    logoUrl: { type: String },
    bannerUrl: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

clubSchema.index({ name: 1 }, { unique: true });
clubSchema.index({ category: 1 });
clubSchema.index({ status: 1 });
clubSchema.index({ createdBy: 1 });

export default mongoose.model("Club", clubSchema);
