import mongoose from "mongoose";

const verificationLogSchema = new mongoose.Schema(
  {
    verifiedAt: { type: Date, default: Date.now },
    ipAddress: String,
    country: String,
    city: String,
    userAgent: String,
    referrer: String,
  },
  { _id: false }
);

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      unique: true,
      index: true,
    },
    verificationId: {
      type: String,
      unique: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CertificateTemplate",
    },

    type: {
      type: String,
      enum: ["participation", "merit", "winner", "runner_up"],
      default: "participation",
    },
    rank: {
      type: String,
      enum: ["1st", "2nd", "3rd", null],
      default: null,
    },
    achievement: {
      type: String,
      default: "successfully participated and completed",
    },

    // Smart Merit Detection fields
    meritScore: { type: Number, default: 0 },
    meritSuggestion: {
      type: String,
      enum: ["participation", "merit", "winner", null],
      default: null,
    },
    meritSuggestionReason: { type: String },
    organiserOverride: { type: Boolean, default: false },

    pdfUrl: { type: String },
    thumbnailUrl: { type: String },

    status: {
      type: String,
      enum: ["pending", "generating", "generated", "sent", "failed", "revoked"],
      default: "pending",
      index: true,
    },

    revokedAt: { type: Date, default: null },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    revokeReason: { type: String, default: "" },

    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
    downloadCount: { type: Number, default: 0 },

    // Analytics
    verifiedCount: { type: Number, default: 0, index: true },
    lastVerifiedAt: { type: Date },
    verificationLogs: [verificationLogSchema],
    monthlyVerifications: [
      {
        month: String,
        count: Number,
      },
    ],

    // Snapshot for fast rendering (no populate needed)
    snapshot: {
      studentName: String,
      studentEmail: String,
      studentRollNo: String,
      eventTitle: String,
      eventDate: String,
      eventCategory: String,
      clubName: String,
      issuerName: String,
    },

    failureReason: { type: String },
    generationStartedAt: { type: Date },
    generationCompletedAt: { type: Date },
  },
  { timestamps: true }
);

certificateSchema.index(
  { studentId: 1, eventId: 1 },
  { unique: true }
);
certificateSchema.index({ status: 1, eventId: 1 });
certificateSchema.index({ verifiedCount: -1 });

// Auto-generate certificateId and verificationId
certificateSchema.pre("save", async function (next) {
  if (!this.certificateId) {
    const year = new Date().getFullYear();
    const code = String(this.eventId).slice(-2).toUpperCase();
    let unique = false;
    let id;

    while (!unique) {
      const num = String(Math.floor(1000 + Math.random() * 9000));
      id = `MITS-${year}-${code}-${num}`;
      const exists = await mongoose
        .model("Certificate")
        .findOne({ certificateId: id });
      if (!exists) unique = true;
    }

    this.certificateId = id;
    this.verificationId = id;
  }

  next();
});

export default mongoose.model("Certificate", certificateSchema);

