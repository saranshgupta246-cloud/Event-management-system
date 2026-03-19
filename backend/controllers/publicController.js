import User from "../models/User.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Club from "../models/Club.js";

function decodeHtmlEntities(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/");
}

export async function getPublicStats(_req, res) {
  try {
    const [students, events, certificates, clubs] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Event.countDocuments({ status: { $in: ["upcoming", "ongoing"] } }),
      Registration.countDocuments({ attendanceStatus: "present" }),
      Club.countDocuments({ status: "active" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        students,
        events,
        certificates,
        clubs,
      },
    });
  } catch (err) {
    console.error("[PublicController.getPublicStats]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getPublicEvents(_req, res) {
  try {
    const now = new Date();

    const events = await Event.find({
      status: { $in: ["upcoming", "ongoing"] },
      eventDate: { $gte: new Date(now.getFullYear() - 1, 0, 1) },
      $or: [
        { registrationEnd: { $gte: now } },
        { registrationEnd: { $exists: false } },
        { registrationEnd: null },
      ],
    })
      .populate("clubId", "name")
      .sort({ eventDate: 1 })
      .limit(6)
      .lean();

    const items = events.map((e) => ({
      _id: e._id,
      title: e.title,
      description: decodeHtmlEntities(e.description),
      imageUrl: decodeHtmlEntities(e.imageUrl || ""),
      eventDate: e.eventDate,
      clubName: e.clubId?.name || "",
      status: e.status,
      totalSeats: typeof e.totalSeats === "number" ? e.totalSeats : 0,
      availableSeats:
        typeof e.availableSeats === "number" ? Math.max(e.availableSeats, 0) : 0,
    }));

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (err) {
    console.error("[PublicController.getPublicEvents]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

