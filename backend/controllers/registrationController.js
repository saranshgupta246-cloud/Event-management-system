import mongoose from "mongoose";
import { z } from "zod";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";

const createRegistrationSchema = z.object({
  eventId: z.string().min(1, "eventId is required"),
});

export async function createRegistration(req, res) {
  try {
    const parseResult = createRegistrationSchema.safeParse(req.body);
    if (!parseResult.success) {
      const msg = parseResult.error.errors.map((e) => e.message).join("; ");
      return res.status(400).json({ success: false, message: msg });
    }

    const { eventId } = parseResult.data;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid event id" });
    }

    const event = await Event.findById(eventId).lean();
    if (!event || event.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Event not available" });
    }

    const now = new Date();
    if (event.registrationStart && event.registrationEnd) {
      const start = new Date(event.registrationStart);
      const end = new Date(event.registrationEnd);

      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (now < start) {
          return res
            .status(400)
            .json({ success: false, message: "Registration has not opened yet" });
        }
        if (now > end) {
          return res
            .status(400)
            .json({ success: false, message: "Registration is closed" });
        }
      }
    }

    const confirmedCount = await Registration.countDocuments({
      event: eventId,
      status: "confirmed",
    });

    if (typeof event.totalSeats === "number" && event.totalSeats > 0) {
      const seatsLeft = event.totalSeats - confirmedCount;
      if (seatsLeft <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "Event is fully booked" });
      }
    }

    try {
      const registration = await Registration.create({
        user: req.user._id,
        event: eventId,
      });

      const populated = await Registration.findById(registration._id)
        .populate("event", "title location eventDate")
        .select("-__v")
        .lean();

      return res.status(201).json({
        success: true,
        data: populated,
        message: "Registration created successfully",
      });
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(400)
          .json({ success: false, message: "Already registered for this event" });
      }
      throw err;
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMyRegistrations(req, res) {
  try {
    const regs = await Registration.find({ user: req.user._id })
      .populate("event", "title location eventDate")
      .select("-__v")
      .sort({ registeredAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: regs,
      message: "Registrations fetched successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

