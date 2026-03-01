import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String },
    answer: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const statusHistoryEntrySchema = new mongoose.Schema(
  {
    fromStatus: { type: String },
    toStatus: { type: String },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    changedAt: { type: Date },
    note: { type: String },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    driveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecruitmentDrive",
      required: true,
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [answerSchema],
    resumeUrl: { type: String },
    portfolioUrl: { type: String },
    status: {
      type: String,
      enum: [
        "pending",
        "shortlisted",
        "interview",
        "selected",
        "rejected",
        "withdrawn",
      ],
      default: "pending",
    },
    rating: { type: Number, min: 1, max: 5 },
    reviewNotes: { type: String },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    statusHistory: [statusHistoryEntrySchema],
  },
  { timestamps: true }
);

applicationSchema.index({ driveId: 1, applicantId: 1 }, { unique: true });
applicationSchema.index({ driveId: 1 });
applicationSchema.index({ clubId: 1 });
applicationSchema.index({ applicantId: 1 });
applicationSchema.index({ reviewedBy: 1 });
applicationSchema.index({ status: 1 });

export default mongoose.model("Application", applicationSchema);
