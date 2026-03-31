import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 255,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter valid email",
      ],
    },
    password: {
      type: String,
      required: false,
      default: null,
      select: false,
    },
    studentId: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    department: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    year: { type: Number },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      match: [
        /^[+]?[\d\s\-()]{7,20}$/,
        "Please enter valid phone",
      ],
    },
    avatar: {
      type: String,
      maxlength: 500,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    socialLinks: {
      github: { type: String, default: "", maxlength: 200, trim: true },
      linkedin: { type: String, default: "", maxlength: 200, trim: true },
      twitter: { type: String, default: "", maxlength: 200, trim: true },
      website: { type: String, default: "", maxlength: 200, trim: true },
    },
    role: {
      type: String,
      enum: ["student", "faculty_coordinator", "faculty", "admin"],
      default: "student",
    },
    clubIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  },
});

userSchema.set("toObject", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

userSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.isModified("name")) {
    this.name = this.name.trim();
  }
  next();
});

userSchema.virtual("displayName").get(function () {
  return this.name || this.email.split("@")[0];
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ studentId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ clubIds: 1 });

export default mongoose.model("User", userSchema);
