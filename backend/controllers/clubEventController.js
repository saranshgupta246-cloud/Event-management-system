import mongoose from "mongoose";
import Event from "../models/Event.js";
import Club from "../models/Club.js";
import Registration from "../models/Registration.js";
import Membership from "../models/Membership.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { localUpload } from "../utils/localUpload.js";

function decodeHtmlEntities(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/");
}

function toObjectIdOrNull(value) {
  if (!value) return null;
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
}

function parseDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function canManageClub(req, clubId) {
  if (!req.user || !clubId) return { allowed: false };
  
  // Admin has full access
  if (req.user.role === "admin") {
    return { allowed: true, level: "admin" };
  }
  
  // Faculty coordinator check
  if (req.user.role === "faculty_coordinator" && 
      req.user.clubIds?.map(id => id.toString()).includes(clubId.toString())) {
    return { allowed: true, level: "coordinator" };
  }
  
  // President check
  const membership = await Membership.findOne({ 
    userId: req.user._id, 
    clubId: new mongoose.Types.ObjectId(clubId),
    status: "approved",
    clubRole: "President"
  });
  
  if (membership) {
    return { 
      allowed: true, 
      level: membership.hasTemporaryPowers ? "president_temp" : "president" 
    };
  }
  
  return { allowed: false };
}

// Create event for a specific club
export async function createClubEvent(req, res) {
  try {
    const clubId = req.params.clubId || req.body.clubId;
    
    if (!clubId || !mongoose.Types.ObjectId.isValid(clubId)) {
      return res.status(400).json({ success: false, message: "Invalid club ID" });
    }
    
    const access = await canManageClub(req, clubId);
    if (!access.allowed) {
      return res.status(403).json({ 
        success: false, 
        message: "Only Faculty Coordinators or Presidents can create events" 
      });
    }
    
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    
    const payload = req.validated || req.body;

    const totalSeats = Number(payload.totalSeats || 0);
    const availableSeats =
      payload.availableSeats === undefined ? totalSeats : Number(payload.availableSeats);

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
      clubId: club._id,
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

    await createAuditLog({
      action: "CLUB_EVENT_CREATED",
      performedBy: req.user._id,
      targetId: event._id,
      targetModel: "Event",
      details: { title: event.title, club: club.name, createdAs: access.level },
      req,
    });

    const plain = event.toObject ? event.toObject() : event;

    return res.status(201).json({
      success: true,
      data: {
        ...plain,
        imageUrl: decodeHtmlEntities(plain.imageUrl),
      },
      message: "Event created successfully",
    });
  } catch (err) {
    console.error("[ClubEventController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

// List events for a specific club
export async function listClubEvents(req, res) {
  try {
    const clubId = req.params.clubId;
    
    if (!clubId || !mongoose.Types.ObjectId.isValid(clubId)) {
      return res.status(400).json({ success: false, message: "Invalid club ID" });
    }
    
    const { status, page = "1", limit = "20" } = req.query;
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 20));
    
    const query = { clubId: new mongoose.Types.ObjectId(clubId) };
    if (status) query.status = status;
    
    const [total, events] = await Promise.all([
      Event.countDocuments(query),
      Event.find(query)
        .sort({ eventDate: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
    ]);
    
    const items = events.map(e => ({
      ...e,
      imageUrl: decodeHtmlEntities(e.imageUrl),
    }));
    
    return res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page: safePage,
        pages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    });
  } catch (err) {
    console.error("[ClubEventController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

// Update event (coordinator or president)
export async function updateClubEvent(req, res) {
  try {
    const { clubId, eventId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    
    // Verify event belongs to this club
    if (event.clubId?.toString() !== clubId) {
      return res.status(403).json({ success: false, message: "Event does not belong to this club" });
    }
    
    const access = await canManageClub(req, clubId);
    if (!access.allowed) {
      return res.status(403).json({ 
        success: false, 
        message: "Only Faculty Coordinators or Presidents can update events" 
      });
    }
    
    const payload = req.validated || req.body;
    
    // Update fields
    if (payload.title !== undefined) event.title = payload.title.trim();
    if (payload.description !== undefined) event.description = payload.description;
    if (payload.eventDate !== undefined) {
      const eventDate = parseDateOrNull(payload.eventDate);
      if (!eventDate) {
        return res.status(400).json({ success: false, message: "Invalid event date" });
      }
      event.eventDate = eventDate;
    }
    if (payload.startTime !== undefined) event.startTime = payload.startTime;
    if (payload.endTime !== undefined) event.endTime = payload.endTime;
    if (payload.location !== undefined) event.location = payload.location;
    if (payload.imageUrl !== undefined) event.imageUrl = payload.imageUrl || "";
    if (payload.status !== undefined) event.status = payload.status;
    if (payload.registrationStart !== undefined) {
      event.registrationStart = parseDateOrNull(payload.registrationStart);
    }
    if (payload.registrationEnd !== undefined) {
      event.registrationEnd = parseDateOrNull(payload.registrationEnd);
    }
    if (payload.totalSeats !== undefined) {
      event.totalSeats = Number(payload.totalSeats);
    }
    if (payload.availableSeats !== undefined) {
      event.availableSeats = Number(payload.availableSeats);
    }
    
    await event.save();
    
    await createAuditLog({
      action: "CLUB_EVENT_UPDATED",
      performedBy: req.user._id,
      targetId: event._id,
      targetModel: "Event",
      details: { title: event.title, updatedAs: access.level },
      req,
    });
    
    const plain = event.toObject ? event.toObject() : event;
    
    return res.status(200).json({
      success: true,
      data: {
        ...plain,
        imageUrl: decodeHtmlEntities(plain.imageUrl),
      },
      message: "Event updated successfully",
    });
  } catch (err) {
    console.error("[ClubEventController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

// Delete event - Coordinator only
export async function deleteClubEvent(req, res) {
  try {
    const { clubId, eventId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    
    // Verify event belongs to this club
    if (event.clubId?.toString() !== clubId) {
      return res.status(403).json({ success: false, message: "Event does not belong to this club" });
    }
    
    // Only coordinator (not president) can delete events
    const access = await canManageClub(req, clubId);
    if (!access.allowed || (access.level !== "coordinator" && access.level !== "admin")) {
      return res.status(403).json({ 
        success: false, 
        message: "Only Faculty Coordinators can delete events" 
      });
    }
    
    // Check for active registrations
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
        message: "Event cancelled (has active registrations). Hard delete not allowed.",
      });
    }

    await Event.findByIdAndDelete(eventId);
    await Registration.deleteMany({ event: event._id });

    await createAuditLog({
      action: "CLUB_EVENT_DELETED",
      performedBy: req.user._id,
      targetId: event._id,
      targetModel: "Event",
      details: { title: event.title },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (err) {
    console.error("[ClubEventController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
