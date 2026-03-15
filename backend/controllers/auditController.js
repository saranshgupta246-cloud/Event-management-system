import AuditLog from "../models/AuditLog.js";

export async function getAuditLogs(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      status,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = {};

    if (action) filter.action = action;
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("performedBy", "name email avatar")
        .populate("targetUser", "name email")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    });
  } catch (err) {
    console.error("[AuditController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getAuditStats(req, res) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalLogs,
      todayLogs,
      failedLogs,
      recentActions,
    ] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({
        createdAt: { $gte: today },
      }),
      AuditLog.countDocuments({
        status: "failed",
      }),
      AuditLog.aggregate([
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalLogs,
        todayLogs,
        failedLogs,
        recentActions,
      },
    });
  } catch (err) {
    console.error("[AuditController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
