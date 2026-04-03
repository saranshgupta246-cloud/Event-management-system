import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    shortName: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

departmentSchema.index({ shortName: 1 }, { unique: true });

export default mongoose.model("Department", departmentSchema);

