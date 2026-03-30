import User from "../models/User.js";
import { createAuditLog } from "../utils/auditLogger.js";
import Membership from "../models/Membership.js";

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
    clubIds: user.clubIds ?? [],
    clubRole: user.clubRole ?? null,
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

    // If the User document doesn't persist clubRole, compute the highest-ranked club role.
    // In Membership, lower roleRank means higher authority (e.g., President = 1).
    const membership = await Membership.findOne({ userId: user._id, status: "approved" })
      .sort({ roleRank: 1 })
      .lean();

    return res
      .status(200)
      .json({
        success: true,
        data: {
          ...toUserResponse(user),
          clubRole: membership?.clubRole ?? null,
        },
      });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
