import mongoose from "mongoose";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import cloudinary from "../config/cloudinary.js";

function toObjectIdOrNull(value) {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
}

function parseDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeDerivedStatus(event) {
  if (!event) return "upcoming";
  if (event.status === "cancelled") return "cancelled";

  const now = new Date();
  const baseDate = event.eventDate ? new Date(event.eventDate) : null;
  if (!baseDate || Number.isNaN(baseDate.getTime())) {
    return event.status || "upcoming";
  }

  const [startHour = "00", startMin = "00"] = (event.startTime || "00:00").split(":");
  const [endHour = "23", endMin = "59"] = (event.endTime || "23:59").split(":");

  const start = new Date(baseDate);
  start.setHours(Number(startHour), Number(startMin), 0, 0);

  const end = new Date(baseDate);
  end.setHours(Number(endHour), Number(endMin), 59, 999);

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "completed";
}

export async function listAdminEvents(req, res) {
  try {
    const {
      search = "",
      status = "",
      page = "1",
      limit = "10",
      sort = "eventDate_desc",
    } = req.query;

    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));

    const query = {};
    if (status) query.status = status;
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      query.$or = [{ title: rx }, { location: rx }, { description: rx }];
    }

    let sortBy = { eventDate: -1, createdAt: -1 };
    if (sort === "eventDate_asc") sortBy = { eventDate: 1, createdAt: -1 };
    if (sort === "created_desc") sortBy = { createdAt: -1 };
    if (sort === "title_asc") sortBy = { title: 1 };

    const [total, itemsRaw, allForStats] = await Promise.all([
      Event.countDocuments(query),
      Event.find(query)
        .populate("clubId", "name")
        .sort(sortBy)
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      Event.find({}).select("status eventDate startTime endTime").limit(1000).lean(),
    ]);

    const eventIds = itemsRaw.map((e) => e._id);
    const registrationsByEvent =
      eventIds.length > 0
        ? await Registration.aggregate([
            { $match: { event: { $in: eventIds }, status: "confirmed" } },
            { $group: { _id: "$event", confirmedRegistrations: { $sum: 1 } } },
          ])
        : [];

    const regMap = new Map(
      registrationsByEvent.map((row) => [String(row._id), row.confirmedRegistrations || 0])
    );

    const items = itemsRaw.map((e) => {
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

      const derivedStatus = computeDerivedStatus(e);

      return {
        ...e,
        status: derivedStatus,
        totalRegistrations,
        seatsLeft,
        availableSeats: normalizedAvailableSeats,
      };
    });

    const stats = allForStats.reduce(
      (acc, e) => {
        const status = computeDerivedStatus(e);
        acc.total += 1;
        if (status === "upcoming") acc.upcoming += 1;
        if (status === "ongoing") acc.ongoing += 1;
        if (status === "completed") acc.completed += 1;
        if (status === "cancelled") acc.cancelled += 1;
        return acc;
      },
      { total: 0, upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 }
    );

    return res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page: safePage,
        pages: Math.max(1, Math.ceil(total / safeLimit)),
        limit: safeLimit,
        stats,
      },
    });
  } catch (err) {
    console.error("[EventController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function createAdminEvent(req, res) {
  try {
    const payload = req.validated || req.body;

    const totalSeats = Number(payload.totalSeats || 0);
    const availableSeats =
      payload.availableSeats === undefined ? totalSeats : Number(payload.availableSeats);

    const clubObjectId = payload.clubId ? toObjectIdOrNull(payload.clubId) : null;
    if (payload.clubId && !clubObjectId) {
      return res.status(400).json({ success: false, message: "Invalid clubId" });
    }

    const eventDate = parseDateOrNull(payload.eventDate);
    if (!eventDate) {
      return res.status(400).json({ success: false, message: "Invalid event date" });
    }

    const registrationStart = parseDateOrNull(payload.registrationStart);
    const registrationEnd = parseDateOrNull(payload.registrationEnd);

    if (!registrationStart || !registrationEnd) {
      return res
        .status(400)
        .json({ success: false, message: "Registration start and end are required." });
    }

    if (registrationStart >= registrationEnd) {
      return res.status(400).json({
        success: false,
        message: "Registration start must be before registration end.",
      });
    }

    // Event start datetime (eventDate + startTime or midnight)
    const [startHour = "00", startMin = "00"] = (payload.startTime || "00:00").split(":");
    const eventStart = new Date(eventDate);
    eventStart.setHours(Number(startHour), Number(startMin), 0, 0);

    if (registrationEnd > eventStart) {
      return res.status(400).json({
        success: false,
        message: "Registration end cannot be after the event start time.",
      });
    }

    const event = await Event.create({
      title: payload.title.trim(),
      description: payload.description || "",
      imageUrl: payload.imageUrl || "",
      clubId: clubObjectId,
      eventDate,
      startTime: payload.startTime || "",
      endTime: payload.endTime || "",
      registrationStart,
      registrationEnd,
      location: payload.location || "",
      totalSeats,
      availableSeats,
      status: payload.status || "upcoming",
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      data: event,
      message: "Event created successfully",
    });
  } catch (err) {
    console.error("[EventController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function updateAdminEvent(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const payload = req.validated || req.body;

    // Compute final values for validation (including registration window)
    const finalEventDate =
      payload.eventDate !== undefined ? parseDateOrNull(payload.eventDate) : event.eventDate;
    if (!finalEventDate) {
      return res.status(400).json({ success: false, message: "Invalid event date" });
    }

    const finalStartTime =
      payload.startTime !== undefined ? payload.startTime : event.startTime || "";

    const finalRegistrationStart =
      payload.registrationStart !== undefined
        ? parseDateOrNull(payload.registrationStart)
        : event.registrationStart;
    const finalRegistrationEnd =
      payload.registrationEnd !== undefined
        ? parseDateOrNull(payload.registrationEnd)
        : event.registrationEnd;

    if (!finalRegistrationStart || !finalRegistrationEnd) {
      return res.status(400).json({
        success: false,
        message: "Registration start and end are required.",
      });
    }

    if (finalRegistrationStart >= finalRegistrationEnd) {
      return res.status(400).json({
        success: false,
        message: "Registration start must be before registration end.",
      });
    }

    const [startHour = "00", startMin = "00"] = (finalStartTime || "00:00").split(":");
    const eventStart = new Date(finalEventDate);
    eventStart.setHours(Number(startHour), Number(startMin), 0, 0);

    if (finalRegistrationEnd > eventStart) {
      return res.status(400).json({
        success: false,
        message: "Registration end cannot be after the event start time.",
      });
    }

    if (payload.title !== undefined) event.title = payload.title.trim();
    if (payload.description !== undefined) event.description = payload.description;
    if (payload.eventDate !== undefined) event.eventDate = finalEventDate;
    if (payload.startTime !== undefined) event.startTime = payload.startTime;
    if (payload.endTime !== undefined) event.endTime = payload.endTime;
    if (payload.location !== undefined) event.location = payload.location;
    if (payload.imageUrl !== undefined) event.imageUrl = payload.imageUrl || "";
    if (payload.status !== undefined) event.status = payload.status;

    event.registrationStart = finalRegistrationStart;
    event.registrationEnd = finalRegistrationEnd;

    if (payload.clubId !== undefined) {
      if (!payload.clubId) {
        event.clubId = null;
      } else {
        const clubObjectId = toObjectIdOrNull(payload.clubId);
        if (!clubObjectId) {
          return res.status(400).json({ success: false, message: "Invalid clubId" });
        }
        event.clubId = clubObjectId;
      }
    }

    if (payload.totalSeats !== undefined) {
      event.totalSeats = Number(payload.totalSeats);
      if (payload.availableSeats === undefined && event.availableSeats > event.totalSeats) {
        event.availableSeats = event.totalSeats;
      }
    }
    if (payload.availableSeats !== undefined) {
      event.availableSeats = Number(payload.availableSeats);
    }

    await event.save();

    return res.status(200).json({
      success: true,
      data: event,
      message: "Event updated successfully",
    });
  } catch (err) {
    console.error("[EventController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function uploadEventImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided." });
    }

    const { buffer, mimetype } = req.file;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG and WebP allowed",
      });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum 5MB allowed",
      });
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "ems/events",
          resource_type: "image",
          transformation: [{ width: 1200, height: 800, crop: "fill", gravity: "center" }],
          format: "webp",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    const imageUrl = uploadResult.secure_url;

    return res.status(200).json({
      success: true,
      url: imageUrl,
      message: "Event image uploaded successfully",
    });
  } catch (err) {
    console.error("[EventController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function deleteAdminEvent(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const activeRegs = await Registration.countDocuments({
      event: event._id,
      status: "confirmed",
    });

    if (activeRegs > 0) {
      event.status = "cancelled";
      await event.save();
      return res.status(200).json({
        success: true,
        data: { cancelled: true, activeRegistrations: activeRegs },
        message:
          "Event cancelled (has active registrations). Hard delete not allowed.",
      });
    }

    await Event.findByIdAndDelete(req.params.id);
    await Registration.deleteMany({ event: event._id });

    return res.status(200).json({
      success: true,
      data: { deletedRegistrations: true },
      message: "Event deleted successfully",
    });
  } catch (err) {
    console.error("[EventController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
