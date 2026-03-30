import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { resolveEventObjectId } from "../utils/resolveEventParam.js";
import { eventNeedsSlug, ensureSlugForEventLean } from "../utils/ensureEventSlug.js";

function decodeHtmlEntities(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/");
}

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

function computeIsRegistrationOpen(event, normalizedAvailableSeats, hasLimitedSeats) {
  const now = new Date();
  const { registrationStart, registrationEnd, status } = event;

  if (status === "cancelled" || status === "completed") {
    return false;
  }

  if (!registrationStart || !registrationEnd) {
    return hasLimitedSeats ? normalizedAvailableSeats > 0 : true;
  }

  const start = new Date(registrationStart);
  const end = new Date(registrationEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return normalizedAvailableSeats > 0;
  }

  if (hasLimitedSeats && normalizedAvailableSeats <= 0) return false;

  return now >= start && now <= end;
}

export async function listStudentEvents(req, res) {
  try {
    const { search = "" } = req.query;

    const query = { status: { $ne: "cancelled" } };
    if (search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      query.$or = [{ title: rx }, { location: rx }, { description: rx }];
    }

    const events = await Event.find(query)
      .populate("clubId", "name")
      .sort({ eventDate: 1 })
      .lean();

    const eventIds = events.map((e) => e._id);

    const [myRegistrations, registrationsByEvent] = await Promise.all([
      Registration.find({
        user: req.user._id,
        event: { $in: eventIds },
        status: "confirmed",
      })
        .select("event")
        .lean(),
      eventIds.length
        ? Registration.aggregate([
            { $match: { event: { $in: eventIds }, status: "confirmed" } },
            { $group: { _id: "$event", confirmedRegistrations: { $sum: 1 } } },
          ])
        : [],
    ]);

    const myRegSet = new Set(myRegistrations.map((r) => String(r.event)));

    const regMap = new Map(
      registrationsByEvent.map((row) => [String(row._id), row.confirmedRegistrations || 0])
    );

    const items = await Promise.all(
      events.map(async (raw) => {
        let e = raw;
        if (eventNeedsSlug(raw)) {
          e = await ensureSlugForEventLean(raw);
        }
      const totalRegistrations = regMap.get(String(e._id)) || 0;
      const hasLimitedSeats = typeof e.totalSeats === "number" && e.totalSeats > 0;

      // Derive from confirmed registrations (source of truth). Stored availableSeats can drift.
      let seatsLeft = null;
      if (hasLimitedSeats) {
        seatsLeft = Math.max(e.totalSeats - totalRegistrations, 0);
      }

      const normalizedAvailableSeats =
        seatsLeft !== null
          ? seatsLeft
          : typeof e.availableSeats === "number"
          ? Math.max(e.availableSeats, 0)
          : 0;

      const isRegistrationOpen = computeIsRegistrationOpen(
        e,
        normalizedAvailableSeats,
        hasLimitedSeats
      );

      return {
        ...e,
        description: decodeHtmlEntities(e.description),
        imageUrl: decodeHtmlEntities(e.imageUrl),
        upiQrImageUrl: decodeHtmlEntities(e.upiQrImageUrl),
        status: computeLifecycleStatus(e),
        clubName: e.clubId?.name || "",
        isRegistered: myRegSet.has(String(e._id)),
        seatsLeft,
        availableSeats: normalizedAvailableSeats,
        isRegistrationOpen,
      };
    })
    );

    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("[StudentEventController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getStudentEvent(req, res) {
  try {
    const resolvedId = await resolveEventObjectId(req.params.id);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    let eventDoc = await Event.findById(resolvedId)
      .populate("clubId", "name")
      .lean();

    if (!eventDoc || eventDoc.status === "cancelled") {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (eventNeedsSlug(eventDoc)) {
      eventDoc = await ensureSlugForEventLean(eventDoc);
    }

    const event = {
      ...eventDoc,
      description: decodeHtmlEntities(eventDoc.description),
      imageUrl: decodeHtmlEntities(eventDoc.imageUrl),
      upiQrImageUrl: decodeHtmlEntities(eventDoc.upiQrImageUrl),
      status: computeLifecycleStatus(eventDoc),
    };

    const [myReg, confirmedCount] = await Promise.all([
      Registration.findOne({
        user: req.user._id,
        event: event._id,
      })
        .select("status paymentStatus utrNumber attendanceStatus qrCodeToken")
        .lean(),
      Registration.countDocuments({ event: event._id, status: "confirmed" }),
    ]);

    let seatsLeft = null;
    const hasLimitedSeats = typeof event.totalSeats === "number" && event.totalSeats > 0;
    if (hasLimitedSeats) {
      seatsLeft = Math.max(event.totalSeats - confirmedCount, 0);
    }

    const normalizedAvailableSeats =
      seatsLeft !== null
        ? seatsLeft
        : typeof event.availableSeats === "number"
        ? Math.max(event.availableSeats, 0)
        : 0;

    const isRegistrationOpen = computeIsRegistrationOpen(
      event,
      normalizedAvailableSeats,
      hasLimitedSeats
    );

    return res.status(200).json({
      success: true,
      data: {
        ...event,
        clubName: event.clubId?.name || "",
        isRegistered: !!myReg,
        myRegistration: myReg || null,
        seatsLeft,
        availableSeats: normalizedAvailableSeats,
        isRegistrationOpen,
      },
    });
  } catch (err) {
    console.error("[StudentEventController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
