import mongoose from "mongoose";
import crypto from "crypto";

const teammateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    email: { type: String, default: "" },
    enrollmentId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["confirmed", "not_found"],
      default: "not_found",
    },
  },
  { _id: false }
);

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
    registrationType: {
      type: String,
      enum: ["solo", "duo", "squad"],
      default: "solo",
    },
    teamName: { type: String, default: "" },
    isTeamLeader: { type: Boolean, default: true },
    teammates: { type: [teammateSchema], default: [] },
    seatsConsumed: { type: Number, default: 1 },
    amountPaid: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "revoked"],
      default: "confirmed",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "confirmed", "revoked"],
      default: "confirmed",
    },
    utrNumber: {
      type: String,
      default: null,
    },
    paymentVerifiedAt: {
      type: Date,
      default: null,
    },
    paymentRevokedAt: {
      type: Date,
      default: null,
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
    removalReason: { type: String, default: null },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    removedAt: {
      type: Date,
      default: null,
    },
    feedback: {
      rating: { type: Number, min: 1, max: 5, default: null },
      comment: { type: String, default: "" },
      submittedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

registrationSchema.index({ user: 1, event: 1 }, { unique: true });
registrationSchema.index({ event: 1, attendanceStatus: 1 });
registrationSchema.index(
  { event: 1, utrNumber: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { utrNumber: { $type: "string" } },
  }
);
registrationSchema.index(
  { event: 1, teamName: 1 },
  {
    unique: true,
    partialFilterExpression: {
      registrationType: { $in: ["duo", "squad"] },
      teamName: { $regex: /.+/ },
    },
  }
);

registrationSchema.pre("validate", function (next) {
  if (!this.qrCodeToken) {
    this.qrCodeToken = crypto.randomBytes(24).toString("hex");
  }
  next();
});

export default mongoose.model("Registration", registrationSchema);
