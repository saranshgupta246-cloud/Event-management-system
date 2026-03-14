import mongoose from "mongoose";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";

function computeIsRegistrationOpen(event, normalizedAvailableSeats) {
  const now = new Date();
  const { registrationStart, registrationEnd, status } = event;

  if (status === "cancelled" || status === "completed") {
    return false;
  }

  if (!registrationStart || !registrationEnd) {
    return normalizedAvailableSeats > 0;
  }

  const start = new Date(registrationStart);
  const end = new Date(registrationEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return normalizedAvailableSeats > 0;
  }

  if (normalizedAvailableSeats <= 0) return false;

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

    const items = events.map((e) => {
      const totalRegistrations = regMap.get(String(e._id)) || 0;

      let seatsLeft = null;
      if (typeof e.totalSeats === "number" && e.totalSeats > 0) {
        seatsLeft = Math.max(e.totalSeats - totalRegistrations, 0);
      }

      const normalizedAvailableSeats =
        seatsLeft !== null
          ? seatsLeft
          : typeof e.availableSeats === "number"
          ? Math.max(e.availableSeats, 0)
          : 0;

      const isRegistrationOpen = computeIsRegistrationOpen(e, normalizedAvailableSeats);

      return {
        ...e,
        clubName: e.clubId?.name || "",
        isRegistered: myRegSet.has(String(e._id)),
        seatsLeft,
        availableSeats: normalizedAvailableSeats,
        isRegistrationOpen,
      };
    });

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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    const event = await Event.findById(req.params.id)
      .populate("clubId", "name")
      .lean();

    if (!event || event.status === "cancelled") {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const [myReg, confirmedCount] = await Promise.all([
      Registration.findOne({
        user: req.user._id,
        event: event._id,
        status: "confirmed",
      })
        .select("status attendanceStatus qrCodeToken")
        .lean(),
      Registration.countDocuments({ event: event._id, status: "confirmed" }),
    ]);

    let seatsLeft = null;
    if (typeof event.totalSeats === "number" && event.totalSeats > 0) {
      seatsLeft = Math.max(event.totalSeats - confirmedCount, 0);
    }

    const normalizedAvailableSeats =
      seatsLeft !== null
        ? seatsLeft
        : typeof event.availableSeats === "number"
        ? Math.max(event.availableSeats, 0)
        : 0;

    const isRegistrationOpen = computeIsRegistrationOpen(event, normalizedAvailableSeats);

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
