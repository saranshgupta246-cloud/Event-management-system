import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: false, default: "" },
    studentId: { type: String },
    department: { type: String },
    year: { type: Number },
    phone: { type: String },
    avatar: { type: String },
    bio: { type: String },
    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    role: {
      type: String,
      enum: ["student", "club_leader", "faculty", "admin"],
      default: "student",
    },
    clubId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ studentId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ clubId: 1 });

export default mongoose.model("User", userSchema);
