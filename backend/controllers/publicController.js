import User from "../models/User.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Club from "../models/Club.js";
import Certificate from "../models/Certificate.js";
import { decodeHtmlEntities } from "../utils/decodeHtmlEntities.js";

function computeLifecycleStatus(event) {
  if (!event) return "upcoming";
  if (event.status === "cancelled") return "cancelled";

  const baseDate = event.eventDate ? new Date(event.eventDate) : null;
  if (!baseDate || Number.isNaN(baseDate.getTime())) return event.status || "upcoming";

  const [startHour = "00", startMin = "00"] = (event.startTime || "00:00").split(":");
  const [endHour = "23", endMin = "59"] = (event.endTime || "23:59").split(":");

  const start = new Date(baseDate);
  start.setHours(Number(startHour), Number(startMin), 0, 0);

  const end = new Date(baseDate);
  end.setHours(Number(endHour), Number(endMin), 59, 999);

  const now = new Date();
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "completed";
}

export async function getPublicStats(_req, res) {
  try {
    const [students, events, certificates, clubs, attendancePresent] = await Promise.all([
      User.countDocuments({ role: "student" }),
      Event.countDocuments({ status: { $in: ["upcoming", "ongoing"] } }),
      Certificate.countDocuments({ status: { $in: ["generated", "sent"] } }),
      Club.countDocuments({ status: "active" }),
      Registration.countDocuments({ attendanceStatus: "present", status: "confirmed" }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        students,
        events,
        certificates,
        clubs,
        attendancePresent,
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
    })
      .populate("clubId", "name")
      .sort({ eventDate: 1 })
      .limit(6)
      .lean();

    const eventIds = events.map((e) => e._id);
    const registrationsByEvent = eventIds.length
      ? await Registration.aggregate([
          { $match: { event: { $in: eventIds }, status: "confirmed" } },
          { $group: { _id: "$event", confirmedRegistrations: { $sum: 1 } } },
        ])
      : [];

    const regMap = new Map(
      registrationsByEvent.map((row) => [String(row._id), row.confirmedRegistrations || 0])
    );

    const items = events.map((e) => {
      const totalRegistrations = regMap.get(String(e._id)) || 0;
      const hasLimitedSeats = typeof e.totalSeats === "number" && e.totalSeats > 0;
      const seatsLeft = hasLimitedSeats ? Math.max(e.totalSeats - totalRegistrations, 0) : null;
      const normalizedAvailableSeats =
        seatsLeft !== null
          ? seatsLeft
          : typeof e.availableSeats === "number"
          ? Math.max(e.availableSeats, 0)
          : 0;

      return {
      _id: e._id,
      title: e.title,
      description: decodeHtmlEntities(e.description),
      imageUrl: decodeHtmlEntities(e.imageUrl || ""),
      eventDate: e.eventDate,
      clubName: e.clubId?.name || "",
      status: computeLifecycleStatus(e),
      totalSeats: typeof e.totalSeats === "number" ? e.totalSeats : 0,
      availableSeats: normalizedAvailableSeats,
      seatsLeft,
    };
    });

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

