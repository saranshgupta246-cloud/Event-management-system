import mongoose from "mongoose";

const customQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String },
    label: { type: String },
    type: {
      type: String,
      enum: ["text", "textarea", "mcq", "checkbox", "url"],
    },
    options: [{ type: String }],
    required: { type: Boolean },
    placeholder: { type: String },
  },
  { _id: false }
);

const recruitmentDriveSchema = new mongoose.Schema(
  {
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    title: { type: String, required: true },
    roleTitle: { type: String, required: true },
    description: { type: String, required: true },
    requiredSkills: [{ type: String }],
    customQuestions: [customQuestionSchema],
    deadline: { type: Date, required: true },
    maxApplicants: { type: Number, default: null },
    status: {
      type: String,
      enum: ["draft", "open", "paused", "closed"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

recruitmentDriveSchema.index({ clubId: 1 });
recruitmentDriveSchema.index({ createdBy: 1 });
recruitmentDriveSchema.index({ status: 1 });
recruitmentDriveSchema.index({ deadline: 1 });
recruitmentDriveSchema.index({ clubId: 1, status: 1 });

export default mongoose.model("RecruitmentDrive", recruitmentDriveSchema);
