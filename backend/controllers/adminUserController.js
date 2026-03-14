import User from "../models/User.js";

export async function searchUsers(req, res) {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
        data: null,
      });
    }

    const q = (req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Provide at least 2 characters",
      });
    }
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({
      $or: [
        { name: regex },
        { email: regex },
        ...(/^[a-zA-Z0-9-]+$/.test(q) ? [{ studentId: regex }] : []),
      ],
      isActive: true,
    })
      .select("name email avatar studentId")
      .limit(20)
      .lean();

    const data = users.map((u) => ({
      ...u,
      enrollmentId: u.studentId,
    }));

    return res.status(200).json({
      success: true,
      data,
      message: "Users fetched successfully",
    });
  } catch (err) {
    console.error("[UserController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
      data: null,
    });
  }
}
