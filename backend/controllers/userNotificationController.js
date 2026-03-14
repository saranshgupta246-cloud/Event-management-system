import UserNotification from "../models/UserNotification.js";

export async function listUserNotifications(req, res) {
  try {
    const userId = req.user._id;
    const list = await UserNotification.find({ userId })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error("[UserNotificationController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function markOneRead(req, res) {
  try {
    const { id } = req.params;
    await UserNotification.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { isRead: true }
    );
    return res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    console.error("[UserNotificationController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function markAllRead(req, res) {
  try {
    await UserNotification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    return res.json({ success: true, message: "All marked as read" });
  } catch (err) {
    console.error("[UserNotificationController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getUnreadCount(req, res) {
  try {
    const count = await UserNotification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });
    return res.json({ success: true, data: { count } });
  } catch (err) {
    console.error("[UserNotificationController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
