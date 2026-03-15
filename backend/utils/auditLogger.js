import AuditLog from "../models/AuditLog.js";

export async function createAuditLog({
  action,
  performedBy,
  targetUser = null,
  targetId = null,
  targetModel = null,
  details = {},
  ipAddress = "",
  userAgent = "",
  status = "success",
  req = null,
}) {
  try {
    const ip = req ? (req.headers["x-forwarded-for"] || req.ip || "") : ipAddress;
    const ua = req ? (req.headers["user-agent"] || "") : userAgent;

    const doc = {
      action,
      performedBy,
      targetUser: targetUser || undefined,
      targetId: targetId ? String(targetId) : undefined,
      details,
      ipAddress: ip,
      userAgent: ua,
      status,
    };
    if (targetModel) doc.targetModel = targetModel;
    await AuditLog.create(doc);
  } catch (err) {
    console.error("[AuditLogger] error:", err);
  }
}
