import User from "../models/User.js";
import { createAuditLog } from "../utils/auditLogger.js";

function toUserResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    department: user.department,
    studentId: user.studentId,
    isActive: user.isActive,
  };
}

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, data: toUserResponse(user) });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
