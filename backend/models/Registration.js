import mongoose from "mongoose";
import crypto from "crypto";

const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
    },
    attendanceStatus: {
      type: String,
      enum: ["absent", "present"],
      default: "absent",
    },
    attendanceMarkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    attendanceMarkedAt: {
      type: Date,
      default: null,
    },
    qrCodeToken: {
      type: String,
      unique: true,
      required: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

registrationSchema.index({ user: 1, event: 1 }, { unique: true });
registrationSchema.index({ event: 1, attendanceStatus: 1 });

registrationSchema.pre("validate", function (next) {
  if (!this.qrCodeToken) {
    this.qrCodeToken = crypto.randomBytes(24).toString("hex");
  }
  next();
});

export default mongoose.model("Registration", registrationSchema);

