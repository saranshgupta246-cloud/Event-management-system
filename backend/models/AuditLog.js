import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      "USER_LOGIN",
      "USER_LOGIN_FAILED",
      "USER_ROLE_CHANGED",
      "USER_DEACTIVATED",
      "USER_ACTIVATED",
      "EVENT_CREATED",
      "EVENT_UPDATED",
      "EVENT_DELETED",
      "EVENT_CANCELLED",
      "CLUB_CREATED",
      "CLUB_UPDATED",
      "CLUB_DEACTIVATED",
      "MEMBER_ADDED",
      "MEMBER_REMOVED",
      "MEMBER_ROLE_CHANGED",
      "CERTIFICATE_GENERATED",
      "CERTIFICATE_TEMPLATE_UPLOADED",
      "BULK_CERTIFICATES_ISSUED",
      "RECRUITMENT_DRIVE_CREATED",
      "RECRUITMENT_DRIVE_CLOSED",
      "APPLICATION_APPROVED",
      "APPLICATION_REJECTED",
    ],
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  targetId: {
    type: String,
    default: null,
  },
  targetModel: {
    type: String,
    enum: ["User", "Event", "Club", "Certificate", "Registration", "RecruitmentDrive"],
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    default: "",
  },
  userAgent: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["success", "failed"],
    default: "success",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

auditLogSchema.index({ action: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetModel: 1 });
auditLogSchema.index({ status: 1 });

export default mongoose.model("AuditLog", auditLogSchema);
