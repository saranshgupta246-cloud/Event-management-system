import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import { resolveEventObjectId } from "../utils/resolveEventParam.js";
import { eventNeedsSlug, ensureSlugForEventLean } from "../utils/ensureEventSlug.js";
import cloudinary from "../config/cloudinary.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { localUpload } from "../utils/localUpload.js";
import {
  normalizeRegistrationTypes,
  computeRequiresUpi,
} from "../utils/eventPricing.js";
import { decodeHtmlEntities } from "../utils/decodeHtmlEntities.js";
import { createUserNotifications } from "../utils/notifications.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toObjectIdOrNull(value) {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
}

function parseDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseNonNegativeNumberOrUndefined(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return n;
}

function parseBooleanOrUndefined(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function emitEventChanged(req, { eventId, action }) {
  try {
    const io = req.app?.get("io");
    if (!io) return;
    io.emit("events:changed", {
      eventId: String(eventId),
      action,
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Realtime emit should never block CRUD response.
  }
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

    const items = await Promise.all(
      itemsRaw.map(async (raw) => {
        let e = raw;
        if (eventNeedsSlug(raw)) {
          e = await ensureSlugForEventLean(raw);
        }
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
        imageUrl: decodeHtmlEntities(e.imageUrl),
        status: derivedStatus,
        totalRegistrations,
        seatsLeft,
        availableSeats: normalizedAvailableSeats,
      };
    })
    );

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

export async function getAdminEventById(req, res) {
  try {
    const { id } = req.params;
    const resolvedId = await resolveEventObjectId(id);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    let event = await Event.findById(resolvedId).populate("clubId", "name").lean();
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    if (eventNeedsSlug(event)) {
      event = await ensureSlugForEventLean(event);
    }
    const confirmedRegistrations = await Registration.countDocuments({
      event: event._id,
      status: "confirmed",
    });
    const totalSeats = Number(event.totalSeats || 0);
    const seatsLeft =
      totalSeats > 0 ? Math.max(totalSeats - confirmedRegistrations, 0) : null;
    return res.status(200).json({
      success: true,
      data: {
        ...event,
        status: computeDerivedStatus(event),
        imageUrl: decodeHtmlEntities(event.imageUrl),
        totalRegistrations: confirmedRegistrations,
        seatsLeft,
        ...(totalSeats > 0 && seatsLeft !== null ? { availableSeats: seatsLeft } : {}),
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

    const totalSeats = parseNonNegativeNumberOrUndefined(payload.totalSeats) ?? 0;
    const availableSeats =
      parseNonNegativeNumberOrUndefined(payload.availableSeats) ?? totalSeats;
    const registrationTypes = normalizeRegistrationTypes(payload.registrationTypes);
    const fees = {
      solo: parseNonNegativeNumberOrUndefined(payload.fees?.solo) ?? 0,
      duo: parseNonNegativeNumberOrUndefined(payload.fees?.duo) ?? 0,
      squad: parseNonNegativeNumberOrUndefined(payload.fees?.squad) ?? 0,
    };
    const isFree = {
      solo: payload.isFree?.solo !== false,
      duo: payload.isFree?.duo !== false,
      squad: payload.isFree?.squad !== false,
    };
    let teamSizeMin = parseNonNegativeNumberOrUndefined(payload.teamSize?.min) ?? 2;
    let teamSizeMax = parseNonNegativeNumberOrUndefined(payload.teamSize?.max) ?? 5;
    teamSizeMin = Math.max(2, Math.min(10, teamSizeMin));
    teamSizeMax = Math.max(teamSizeMin, Math.min(10, teamSizeMax));
    const needsUpi = computeRequiresUpi(registrationTypes, fees, isFree);
    const upiId = needsUpi ? (payload.upiId || "").trim() : "";
    const upiQrImageUrl = needsUpi ? payload.upiQrImageUrl || "" : "";

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
    if (needsUpi && (!upiId || !upiQrImageUrl)) {
      return res.status(400).json({
        success: false,
        message:
          "UPI ID and UPI QR image are required when any registration type is paid.",
      });
    }

    if (registrationTypes.includes("squad") && teamSizeMax < teamSizeMin) {
      return res.status(400).json({
        success: false,
        message: "Squad max team size must be greater than or equal to min.",
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
      registrationTypes,
      fees,
      isFree,
      teamSize: { min: teamSizeMin, max: teamSizeMax },
      upiId,
      upiQrImageUrl,
      isRecommended: parseBooleanOrUndefined(payload.isRecommended) ?? false,
      isWorkshop: parseBooleanOrUndefined(payload.isWorkshop) ?? false,
      status: "upcoming",
      createdBy: req.user._id,
    });

    await createAuditLog({
      action: "EVENT_CREATED",
      performedBy: req.user._id,
      targetId: event._id,
      targetModel: "Event",
      details: { title: event.title },
      req,
    });

    const plain = event.toObject ? event.toObject() : event;
    emitEventChanged(req, { eventId: event._id, action: "created" });

    return res.status(201).json({
      success: true,
      data: {
        ...plain,
        imageUrl: decodeHtmlEntities(plain.imageUrl),
      },
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
    const resolvedId = await resolveEventObjectId(req.params.id);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    const event = await Event.findById(resolvedId);
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

    const parsedTotalSeats = parseNonNegativeNumberOrUndefined(payload.totalSeats);
    const parsedAvailableSeats = parseNonNegativeNumberOrUndefined(payload.availableSeats);
    if (parsedTotalSeats !== undefined) {
      event.totalSeats = parsedTotalSeats;
      if (parsedAvailableSeats === undefined && event.availableSeats > event.totalSeats) {
        event.availableSeats = event.totalSeats;
      }
    }
    if (parsedAvailableSeats !== undefined) {
      event.availableSeats = parsedAvailableSeats;
    }
    if (payload.registrationTypes !== undefined) {
      event.registrationTypes = normalizeRegistrationTypes(payload.registrationTypes);
    }
    if (payload.fees !== undefined) {
      const f = payload.fees;
      if (f.solo !== undefined)
        event.fees.solo = parseNonNegativeNumberOrUndefined(f.solo) ?? 0;
      if (f.duo !== undefined) event.fees.duo = parseNonNegativeNumberOrUndefined(f.duo) ?? 0;
      if (f.squad !== undefined)
        event.fees.squad = parseNonNegativeNumberOrUndefined(f.squad) ?? 0;
    }
    if (payload.isFree !== undefined) {
      const fr = payload.isFree;
      if (fr.solo !== undefined) event.isFree.solo = !!fr.solo;
      if (fr.duo !== undefined) event.isFree.duo = !!fr.duo;
      if (fr.squad !== undefined) event.isFree.squad = !!fr.squad;
    }
    if (payload.teamSize !== undefined) {
      let tmin = parseNonNegativeNumberOrUndefined(payload.teamSize.min) ?? event.teamSize.min;
      let tmax = parseNonNegativeNumberOrUndefined(payload.teamSize.max) ?? event.teamSize.max;
      tmin = Math.max(2, Math.min(10, tmin));
      tmax = Math.max(tmin, Math.min(10, tmax));
      event.teamSize = { min: tmin, max: tmax };
    }
    if (payload.upiId !== undefined) {
      event.upiId = (payload.upiId || "").trim();
    }
    if (payload.upiQrImageUrl !== undefined) {
      event.upiQrImageUrl = payload.upiQrImageUrl || "";
    }
    const needsUpi = computeRequiresUpi(
      event.registrationTypes,
      event.fees,
      event.isFree
    );
    if (!needsUpi) {
      event.upiId = "";
      event.upiQrImageUrl = "";
    } else if (!event.upiId || !event.upiQrImageUrl) {
      return res.status(400).json({
        success: false,
        message:
          "UPI ID and UPI QR image are required when any registration type is paid.",
      });
    }
    const parsedIsRecommended = parseBooleanOrUndefined(payload.isRecommended);
    const parsedIsWorkshop = parseBooleanOrUndefined(payload.isWorkshop);
    if (parsedIsRecommended !== undefined) {
      event.isRecommended = parsedIsRecommended;
    }
    if (parsedIsWorkshop !== undefined) {
      event.isWorkshop = parsedIsWorkshop;
    }

    await event.save();

    const plain = event.toObject ? event.toObject() : event;

    await createAuditLog({
      action: "EVENT_UPDATED",
      performedBy: req.user._id,
      targetId: event._id,
      targetModel: "Event",
      details: { title: event.title },
      req,
    });
    emitEventChanged(req, { eventId: event._id, action: "updated" });

    return res.status(200).json({
      success: true,
      data: {
        ...plain,
        imageUrl: decodeHtmlEntities(plain.imageUrl),
      },
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

    const { buffer, mimetype, originalname } = req.file;

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

    // Save image locally instead of uploading to Cloudinary.
    const imageUrl = await localUpload({
      buffer,
      mimetype,
      folder: "events",
      filename: originalname,
    });

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

export async function uploadEventQr(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided." });
    }

    const { buffer, mimetype, originalname } = req.file;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG and WebP allowed",
      });
    }

    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum 5MB allowed",
      });
    }

    const imageUrl = await localUpload({
      buffer,
      mimetype,
      folder: "event-upi-qr",
      filename: originalname,
    });

    return res.status(200).json({
      success: true,
      url: imageUrl,
      message: "UPI QR image uploaded successfully",
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

export async function updateCertificateCoords(req, res) {
  try {
    const rawId = req.params.id || req.params.eventId;
    const resolvedId = await resolveEventObjectId(rawId);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    const {
      nameY,
      positionY,
      rollNoY,
      rollNoEnabled,
      fontSize,
      positionFontSize,
    } = req.body;

    const event = await Event.findById(resolvedId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    event.certificateCoords = {
      nameY: Number(nameY) || 400,
      nameAutoCenter: true,
      positionY: Number(positionY) || 450,
      positionAutoCenter: true,
      rollNoY: Number(rollNoY) || 470,
      rollNoAutoCenter: true,
      rollNoEnabled: Boolean(rollNoEnabled),
      fontSize: Number(fontSize) || 28,
      positionFontSize: Number(positionFontSize) || 20,
    };

    await event.save();

    return res.status(200).json({
      success: true,
      data: event.certificateCoords,
      message: "Certificate coordinates saved",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function uploadCertificateFont(req, res) {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No font file" });
    }

    const resolvedId = await resolveEventObjectId(id);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const event = await Event.findById(resolvedId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const uploadsDir = path.join(
      __dirname,
      "..",
      "uploads",
      "certificate-fonts",
      String(event._id)
    );
    fs.mkdirSync(uploadsDir, { recursive: true });

    const original = (req.file.originalname || "font.ttf").replace(/[^\w.\-]+/g, "_");
    const filename = `font_${Date.now()}_${original}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    const fontUrl = `/uploads/certificate-fonts/${String(event._id)}/${filename}`;

    return res.status(200).json({
      success: true,
      data: { fontUrl },
      message:
        "Font file stored (certificate PDFs use built-in Helvetica; custom font is not applied to generated certificates).",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function deleteAdminEvent(req, res) {
  try {
    const resolvedId = await resolveEventObjectId(req.params.id);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const event = await Event.findById(resolvedId);
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

      // Notify registered students (best effort).
      try {
        const regs = await Registration.find({ event: event._id, status: "confirmed" })
          .select("user")
          .lean();
        const userIds = [...new Set(regs.map((r) => String(r.user)).filter(Boolean))];
        if (userIds.length > 0) {
          await createUserNotifications(userIds, {
            type: "event_cancelled",
            title: "Event cancelled",
            message: `'${event.title}' has been cancelled by the admin.`,
            link: "/student/events",
          });
        }
      } catch {
        // ignore notification failures
      }

      await createAuditLog({
        action: "EVENT_CANCELLED",
        performedBy: req.user._id,
        targetId: event._id,
        targetModel: "Event",
        details: { title: event.title },
        req,
      });
      emitEventChanged(req, { eventId: event._id, action: "cancelled" });
      return res.status(200).json({
        success: true,
        data: { cancelled: true, activeRegistrations: activeRegs },
        message:
          "Event cancelled (has active registrations). Hard delete not allowed.",
      });
    }

    await Event.findByIdAndDelete(resolvedId);
    await Registration.deleteMany({ event: event._id });

    await createAuditLog({
      action: "EVENT_DELETED",
      performedBy: req.user._id,
      targetId: event._id,
      targetModel: "Event",
      details: { title: event.title },
      req,
    });
    emitEventChanged(req, { eventId: event._id, action: "deleted" });

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
