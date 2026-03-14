import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },

    category: {
      type: String,
      enum: ["gold", "navy", "elegant", "custom"],
      default: "custom",
    },

    // Uploaded certificate image (PNG/JPG)
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String },

    // Where to place the student name on the image (percentages)
    namePosition: {
      x: { type: Number, default: 50 }, // % from left
      y: { type: Number, default: 55 }, // % from top
    },

    // Text styling for the name overlay
    nameStyle: {
      fontSize: { type: Number, default: 64 },
      fontFamily: {
        type: String,
        enum: ["serif", "sans-serif", "script"],
        default: "serif",
      },
      color: { type: String, default: "#1a1a2e" },
      bold: { type: Boolean, default: false },
      align: {
        type: String,
        enum: ["left", "center", "right"],
        default: "center",
      },
    },

    // Optional verification ID text
    showVerificationId: { type: Boolean, default: true },
    verificationIdPosition: {
      x: { type: Number, default: 50 },
      y: { type: Number, default: 92 },
    },

    // Optional QR code
    showQR: { type: Boolean, default: true },
    qrPosition: {
      x: { type: Number, default: 85 },
      y: { type: Number, default: 85 },
    },
    qrSize: { type: Number, default: 80 },

    // Image dimensions (stored after upload)
    imageWidth: { type: Number, default: 794 },
    imageHeight: { type: Number, default: 1123 },

    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// No built-in HTML templates anymore – admins upload designs instead.
templateSchema.statics.getDefaultTemplates = function () {
  return [];
};

export default mongoose.model("CertificateTemplate", templateSchema);

