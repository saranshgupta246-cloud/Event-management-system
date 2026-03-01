import Notification from "../models/Notification.js";
import NotificationRead from "../models/NotificationRead.js";

function audienceMatchesRole(audience, role) {
  if (audience === "all") return true;
  if (audience === "students" && role === "student") return true;
  if (audience === "faculty" && role === "faculty") return true;
  if (audience === "club_leaders" && role === "club_leader") return true;
  return false;
}

function buildActiveFilter() {
  const now = new Date();
  return {
    isActive: { $ne: false },
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };
}

export async function listNotifications(req, res) {
  try {
    const role = req.user.role;
    const scope = req.query.scope;

    const baseFilter = buildActiveFilter();

    const all = await Notification.find(baseFilter)
      .sort({ pinned: -1, createdAt: -1 })
      .limit(50)
      .lean();

    let visible;
    if (role === "admin" && scope === "admin-all") {
      // Admin-wide view: show all active notifications regardless of audience
      visible = all;
    } else {
      visible = all.filter((n) => audienceMatchesRole(n.audience, role));
    }

    const reads = await NotificationRead.find({
      userId: req.user._id,
      notificationId: { $in: visible.map((n) => n._id) },
    })
      .select("notificationId")
      .lean();

    const readSet = new Set(reads.map((r) => r.notificationId.toString()));

    const result = visible.map((n) => ({
      ...n,
      isRead: readSet.has(n._id.toString()),
    }));

    const unreadCount = result.filter((n) => !n.isRead).length;

    return res.json({ success: true, data: result, unreadCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function markRead(req, res) {
  try {
    const { id } = req.params;
    await NotificationRead.findOneAndUpdate(
      { userId: req.user._id, notificationId: id },
      { userId: req.user._id, notificationId: id, readAt: new Date() },
      { upsert: true, new: true }
    );
    return res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function markAllRead(req, res) {
  try {
    const role = req.user.role;
    const all = await Notification.find().select("_id audience").lean();
    const visible = all.filter((n) => audienceMatchesRole(n.audience, role));

    const ops = visible.map((n) => ({
      updateOne: {
        filter: { userId: req.user._id, notificationId: n._id },
        update: { userId: req.user._id, notificationId: n._id, readAt: new Date() },
        upsert: true,
      },
    }));

    if (ops.length > 0) await NotificationRead.bulkWrite(ops);
    return res.json({ success: true, message: "All marked as read" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createNotification(req, res) {
  try {
    const { title, message, audience, pinned, expiresAt } = req.body;
    if (!title?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    let parsedExpiresAt = null;
    if (!pinned) {
      if (expiresAt) {
        const candidate = new Date(expiresAt);
        if (!Number.isNaN(candidate.getTime()) && candidate > new Date()) {
          parsedExpiresAt = candidate;
        }
      }
      // If no valid future expiresAt was provided for an unpinned notification,
      // default to 24 hours from now so broadcasts auto-expire.
      if (!parsedExpiresAt) {
        parsedExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
    }

    const notif = await Notification.create({
      title: title.trim(),
      message: message?.trim() || "",
      audience: audience || "all",
      pinned: !!pinned,
      expiresAt: pinned ? null : parsedExpiresAt,
      isActive: true,
      createdBy: req.user._id,
    });
    return res
      .status(201)
      .json({ success: true, data: notif, message: "Notification created" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    await NotificationRead.deleteMany({ notificationId: id });
    return res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deactivateNotification(req, res) {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!notif) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }
    return res.json({
      success: true,
      data: notif,
      message: "Notification deactivated",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
