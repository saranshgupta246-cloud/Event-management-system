import mongoose from "mongoose";
import { Parser as Json2CsvParser } from "json2csv";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";

export async function getEventAttendance(req, res) {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid event id" });
    }

    const event = await Event.findById(eventId).lean();
    if (!event || event.status === "cancelled") {
      return res.status(404).json({ success: false, message: "Event not found or cancelled" });
    }

    // If club leader, ensure event belongs to their club
    if (req.user.role === "club_leader" && req.user.clubId && event.clubId) {
      if (event.clubId.toString() !== req.user.clubId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied for this event" });
      }
    }

    const regs = await Registration.find({ event: eventId })
      .populate("user", "name email studentId")
      .lean();

    const totalRegistered = regs.length;
    const totalPresent = regs.filter((r) => r.attendanceStatus === "present").length;
    const totalAbsent = totalRegistered - totalPresent;
    const attendancePercentage =
      totalRegistered === 0 ? 0 : Math.round((totalPresent / totalRegistered) * 100);

    return res.status(200).json({
      success: true,
      data: {
        event,
        totals: {
          totalRegistered,
          totalPresent,
          totalAbsent,
          attendancePercentage,
        },
        participants: regs.map((r) => ({
          id: r._id,
          userId: r.user?._id,
          name: r.user?.name,
          email: r.user?.email,
          studentId: r.user?.studentId || "",
          status: r.attendanceStatus,
          registeredAt: r.registeredAt,
          attendanceMarkedAt: r.attendanceMarkedAt,
        })),
      },
      message: "Attendance fetched successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function scanAttendance(req, res) {
  try {
    const { qrCodeToken } = req.validated;

    const registration = await Registration.findOne({ qrCodeToken })
      .populate("event")
      .populate("user", "name email")
      .exec();

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    if (!registration.event || registration.event.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Event not active" });
    }

    // Club leader can only mark attendance for their own club's events
    if (req.user.role === "club_leader" && req.user.clubId && registration.event.clubId) {
      if (registration.event.clubId.toString() !== req.user.clubId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied for this event" });
      }
    }

    if (registration.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Registration cancelled. Cannot mark attendance." });
    }

    if (registration.attendanceStatus === "present") {
      return res
        .status(400)
        .json({ success: false, message: "Attendance already marked for this participant" });
    }

    registration.attendanceStatus = "present";
    registration.attendanceMarkedBy = req.user._id;
    registration.attendanceMarkedAt = new Date();
    await registration.save();

    return res.status(200).json({
      success: true,
      data: {
        registrationId: registration._id,
        user: registration.user,
        eventId: registration.event._id,
        attendanceStatus: registration.attendanceStatus,
        attendanceMarkedAt: registration.attendanceMarkedAt,
      },
      message: "Attendance marked successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function manualMarkAttendance(req, res) {
  try {
    const { registrationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(registrationId)) {
      return res.status(400).json({ success: false, message: "Invalid registration id" });
    }

    const registration = await Registration.findById(registrationId)
      .populate("event")
      .populate("user", "name email")
      .exec();

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    if (!registration.event || registration.event.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Event not active" });
    }

    if (req.user.role === "club_leader" && req.user.clubId && registration.event.clubId) {
      if (registration.event.clubId.toString() !== req.user.clubId.toString()) {
        return res.status(403).json({ success: false, message: "Access denied for this event" });
      }
    }

    if (registration.status === "cancelled") {
      return res
        .status(400)
        .json({ success: false, message: "Registration cancelled. Cannot mark attendance." });
    }

    if (registration.attendanceStatus === "present") {
      return res
        .status(400)
        .json({ success: false, message: "Attendance already marked for this participant" });
    }

    registration.attendanceStatus = "present";
    registration.attendanceMarkedBy = req.user._id;
    registration.attendanceMarkedAt = new Date();
    await registration.save();

    return res.status(200).json({
      success: true,
      data: {
        registrationId: registration._id,
        user: registration.user,
        eventId: registration.event._id,
        attendanceStatus: registration.attendanceStatus,
        attendanceMarkedAt: registration.attendanceMarkedAt,
      },
      message: "Attendance overridden successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function exportAttendanceCsv(req, res) {
  try {
    const { eventId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid event id" });
    }

    const regs = await Registration.find({ event: eventId })
      .populate("user", "name email")
      .lean();

    if (!regs.length) {
      return res.status(404).json({ success: false, message: "No registrations found" });
    }

    const rows = regs.map((r) => ({
      name: r.user?.name || "",
      email: r.user?.email || "",
      studentId: r.user?.studentId || "",
      attendanceStatus: r.attendanceStatus,
      registeredAt: r.registeredAt,
      attendanceMarkedAt: r.attendanceMarkedAt,
    }));

    const parser = new Json2CsvParser({
      fields: ["name", "email", "studentId", "attendanceStatus", "registeredAt", "attendanceMarkedAt"],
    });
    const csv = parser.parse(rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance-${eventId}.csv"`
    );
    return res.status(200).send(csv);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

