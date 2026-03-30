import mongoose from "mongoose";
import { z } from "zod";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import { resolveEventObjectId } from "../utils/resolveEventParam.js";
import { feeForRegistrationType } from "../utils/eventPricing.js";
import { createUserNotifications } from "../utils/notifications.js";

const teammateBodySchema = z.object({
  email: z.string().trim().optional(),
  enrollmentId: z.string().trim().optional(),
});

const createRegistrationSchema = z
  .object({
    eventId: z.string().min(1, "eventId is required"),
    registrationType: z.enum(["solo", "duo", "squad"]).default("solo"),
    teamName: z.string().trim().optional(),
    teammates: z.array(teammateBodySchema).optional(),
    utrNumber: z.string().trim().regex(/^\d{12}$/, "UTR must be a 12-digit number").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.registrationType === "duo" || data.registrationType === "squad") {
      const name = (data.teamName || "").trim();
      if (!name) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Team name is required" });
      }
    }
  });

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveTeammateRow(input) {
  const emailRaw = (input.email || "").trim().toLowerCase();
  const enrollmentId = (input.enrollmentId || "").trim();
  if (!emailRaw && !enrollmentId) {
    return {
      userId: null,
      email: "",
      enrollmentId: "",
      status: "not_found",
    };
  }

  let userDoc = null;
  if (emailRaw) {
    userDoc = await User.findOne({
      email: new RegExp(`^${escapeRegex(emailRaw)}$`, "i"),
    })
      .select("_id email studentId")
      .lean();
  }
  if (!userDoc && enrollmentId) {
    userDoc = await User.findOne({ studentId: enrollmentId }).select("_id email studentId").lean();
  }

  if (userDoc) {
    return {
      userId: userDoc._id,
      email: userDoc.email || emailRaw || "",
      enrollmentId: userDoc.studentId || enrollmentId || "",
      status: "confirmed",
    };
  }

  return {
    userId: null,
    email: emailRaw || "",
    enrollmentId: enrollmentId || "",
    status: "not_found",
  };
}

async function assertNoDuplicateUsersForEvent(eventId, leaderId, teammateRows) {
  const leaderStr = String(leaderId);
  const ids = teammateRows.map((t) => t.userId).filter(Boolean);
  for (const tid of ids) {
    if (String(tid) === leaderStr) {
      return { ok: false, message: "You cannot list yourself as a teammate." };
    }
  }

  const existingLeader = await Registration.findOne({
    event: eventId,
    user: leaderId,
    status: "confirmed",
  })
    .select("_id")
    .lean();
  if (existingLeader) {
    return { ok: false, message: "Already registered for this event" };
  }

  const uidSet = ids.map((id) => new mongoose.Types.ObjectId(id));
  for (const uid of uidSet) {
    const clash = await Registration.findOne({
      event: eventId,
      status: "confirmed",
      $or: [{ user: uid }, { "teammates.userId": uid }],
    })
      .select("_id")
      .lean();
    if (clash) {
      return {
        ok: false,
        message: "One or more teammates are already registered for this event.",
      };
    }
  }

  return { ok: true };
}

function isMongoTransactionNotSupportedError(err) {
  const msg = String(err?.message || "");
  return (
    msg.includes("Transaction numbers are only allowed on a replica set member or mongos") ||
    msg.includes("MongoServerError: Transaction numbers are only allowed") ||
    // Some drivers surface a generic hint as well.
    msg.toLowerCase().includes("transactions are not supported")
  );
}

export async function createRegistration(req, res) {
  try {
    const parseResult = createRegistrationSchema.safeParse(req.body);
    if (!parseResult.success) {
      const msg = parseResult.error.errors.map((e) => e.message).join("; ");
      return res.status(400).json({ success: false, message: msg });
    }

    const { eventId, registrationType, teamName, teammates: rawTeammates, utrNumber } =
      parseResult.data;

    const resolvedEventId = await resolveEventObjectId(eventId);
    if (!resolvedEventId) {
      return res.status(400).json({ success: false, message: "Invalid event id" });
    }

    const event = await Event.findById(resolvedEventId).lean();
    if (!event || event.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Event not available" });
    }

    const enabledTypes =
      Array.isArray(event.registrationTypes) && event.registrationTypes.length > 0
        ? event.registrationTypes
        : ["solo"];
    if (!enabledTypes.includes(registrationType)) {
      return res.status(400).json({
        success: false,
        message: "This registration type is not available for this event",
      });
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
          return res.status(400).json({ success: false, message: "Registration is closed" });
        }
      }
    }

    const fee = feeForRegistrationType(event, registrationType);
    const isPaid = fee > 0;
    if (isPaid && !utrNumber) {
      return res.status(400).json({
        success: false,
        message: "UTR is required for paid registration.",
      });
    }

    const dupUtr = isPaid
      ? await Registration.findOne({
          event: resolvedEventId,
          utrNumber,
          status: "confirmed",
        })
          .select("_id")
          .lean()
      : null;
    if (dupUtr) {
      return res.status(400).json({
        success: false,
        message: "This UTR has already been used for this event.",
      });
    }

    let teammateRows = [];
    const minSquad = Math.max(2, Number(event.teamSize?.min ?? 2));
    const maxSquad = Math.min(10, Math.max(minSquad, Number(event.teamSize?.max ?? 5)));

    if (registrationType === "solo") {
      teammateRows = [];
    } else if (registrationType === "duo") {
      const inputs = rawTeammates || [];
      if (inputs.length !== 1) {
        return res.status(400).json({
          success: false,
          message: "Duo registration requires exactly one teammate.",
        });
      }
      teammateRows = await Promise.all(inputs.map((t) => resolveTeammateRow(t)));
      if (!teammateRows[0].email && !teammateRows[0].enrollmentId) {
        return res.status(400).json({
          success: false,
          message: "Teammate email or enrollment ID is required.",
        });
      }
    } else if (registrationType === "squad") {
      const inputs = rawTeammates || [];
      const needMin = minSquad - 1;
      const needMax = maxSquad - 1;
      if (inputs.length < needMin || inputs.length > needMax) {
        return res.status(400).json({
          success: false,
          message: `Squad requires between ${needMin} and ${needMax} teammates.`,
        });
      }
      teammateRows = await Promise.all(inputs.map((t) => resolveTeammateRow(t)));
      for (const row of teammateRows) {
        if (!row.email && !row.enrollmentId) {
          return res.status(400).json({
            success: false,
            message: "Each teammate must have an email or enrollment ID.",
          });
        }
      }
    }

    const seatsConsumed = 1 + teammateRows.length;

    const dupCheck = await assertNoDuplicateUsersForEvent(
      resolvedEventId,
      req.user._id,
      teammateRows
    );
    if (!dupCheck.ok) {
      return res.status(400).json({ success: false, message: dupCheck.message });
    }

    const totalSeats = typeof event.totalSeats === "number" ? event.totalSeats : 0;
    if (totalSeats > 0) {
      const confirmedCount = await Registration.countDocuments({
        event: resolvedEventId,
        status: "confirmed",
      });
      const derivedAvailable = Math.max(totalSeats - confirmedCount, 0);
      if ((event.availableSeats ?? 0) !== derivedAvailable) {
        await Event.findByIdAndUpdate(resolvedEventId, {
          $set: { availableSeats: derivedAvailable },
        });
        event.availableSeats = derivedAvailable;
      }
    }
    if (totalSeats > 0 && (event.availableSeats ?? 0) < seatsConsumed) {
      return res.status(400).json({
        success: false,
        message: "Not enough seats for your team size",
      });
    }

    const amountPaid = isPaid ? fee : 0;
    const finalTeamName = (teamName || "").trim();

    if (registrationType === "duo" || registrationType === "squad") {
      const dupTeam = await Registration.findOne({
        event: resolvedEventId,
        registrationType: { $in: ["duo", "squad"] },
        status: "confirmed",
        teamName: new RegExp(`^${escapeRegex(finalTeamName)}$`, "i"),
      })
        .select("_id")
        .lean();
      if (dupTeam) {
        return res.status(400).json({
          success: false,
          message: `A team named '${finalTeamName}' is already registered for this event. Please choose a different name.`,
        });
      }
    }

    const createWithNoTransaction = async () => {
      let seatsDecremented = false;
      try {
        if (totalSeats > 0) {
          const updated = await Event.findOneAndUpdate(
            { _id: resolvedEventId, availableSeats: { $gte: seatsConsumed } },
            { $inc: { availableSeats: -seatsConsumed } },
            { new: true }
          ).lean();
          if (!updated) {
            return res.status(400).json({
              success: false,
              message: "Not enough seats for your team size",
            });
          }
          seatsDecremented = true;
        }

        const registration = await Registration.create({
          user: req.user._id,
          event: resolvedEventId,
          registrationType,
          teamName: registrationType === "solo" ? "" : finalTeamName,
          isTeamLeader: true,
          teammates: teammateRows,
          seatsConsumed,
          amountPaid,
          status: "confirmed",
          paymentStatus: "confirmed",
          utrNumber: isPaid ? utrNumber : null,
          paymentVerifiedAt: isPaid ? new Date() : null,
        });

        const populated = await Registration.findById(registration._id)
          .populate(
            "event",
            "title location eventDate fees isFree registrationTypes teamSize upiId upiQrImageUrl"
          )
          .select("-__v")
          .lean();

        return res.status(201).json({
          success: true,
          data: populated,
          message: "Registration created successfully",
        });
      } catch (err) {
        // Best-effort compensation when running without transactions.
        if (seatsDecremented) {
          try {
            await Event.findByIdAndUpdate(resolvedEventId, {
              $inc: { availableSeats: seatsConsumed },
            });
          } catch {
            // ignore compensation errors
          }
        }

        if (err.code === 11000) {
          if (err?.keyPattern?.utrNumber) {
            return res.status(400).json({
              success: false,
              message: "This UTR has already been used for this event.",
            });
          }
          if (err?.keyPattern?.teamName && err?.keyPattern?.event) {
            return res.status(400).json({
              success: false,
              message: `A team named '${finalTeamName}' is already registered for this event. Please choose a different name.`,
            });
          }
          return res
            .status(400)
            .json({ success: false, message: "Already registered for this event" });
        }
        throw err;
      }
    };

    // Prefer transactions when MongoDB supports them, but gracefully fall back for standalone.
    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();

      if (totalSeats > 0) {
        const updated = await Event.findOneAndUpdate(
          { _id: resolvedEventId, availableSeats: { $gte: seatsConsumed } },
          { $inc: { availableSeats: -seatsConsumed } },
          { new: true, session }
        ).lean();
        if (!updated) {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: "Not enough seats for your team size",
          });
        }
      }

      const [registration] = await Registration.create(
        [
          {
            user: req.user._id,
            event: resolvedEventId,
            registrationType,
            teamName: registrationType === "solo" ? "" : finalTeamName,
            isTeamLeader: true,
            teammates: teammateRows,
            seatsConsumed,
            amountPaid,
            status: "confirmed",
            paymentStatus: "confirmed",
            utrNumber: isPaid ? utrNumber : null,
            paymentVerifiedAt: isPaid ? new Date() : null,
          },
        ],
        { session }
      );

      await session.commitTransaction();

      const populated = await Registration.findById(registration._id)
        .populate(
          "event",
          "title location eventDate fees isFree registrationTypes teamSize upiId upiQrImageUrl"
        )
        .select("-__v")
        .lean();

      return res.status(201).json({
        success: true,
        data: populated,
        message: "Registration created successfully",
      });
    } catch (err) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch {
          // ignore abort errors
        }
      }

      if (isMongoTransactionNotSupportedError(err)) {
        return await createWithNoTransaction();
      }

      if (err.code === 11000) {
        if (err?.keyPattern?.utrNumber) {
          return res.status(400).json({
            success: false,
            message: "This UTR has already been used for this event.",
          });
        }
        if (err?.keyPattern?.teamName && err?.keyPattern?.event) {
          return res.status(400).json({
            success: false,
            message: `A team named '${finalTeamName}' is already registered for this event. Please choose a different name.`,
          });
        }
        return res
          .status(400)
          .json({ success: false, message: "Already registered for this event" });
      }
      throw err;
    } finally {
      if (session) session.endSession();
    }
  } catch (err) {
    console.error("[RegistrationController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

async function restoreSeatsForRegistrationDoc(registration) {
  const ev = await Event.findById(registration.event).select("totalSeats").lean();
  if (!ev || !ev.totalSeats) return;
  const n = registration.seatsConsumed || 1;
  await Event.findByIdAndUpdate(registration.event, { $inc: { availableSeats: n } });
}

function registrationIsPaid(reg, event) {
  if (Number(reg?.amountPaid || 0) > 0) return true;
  if (event && feeForRegistrationType(event, reg?.registrationType) > 0) return true;
  return false;
}

export async function getMyRegistrations(req, res) {
  try {
    const regs = await Registration.find({ user: req.user._id })
      .populate(
        "event",
        "title location eventDate fees isFree registrationTypes teamSize upiId upiQrImageUrl slug"
      )
      .select("-__v")
      .sort({ registeredAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: regs,
      message: "Registrations fetched successfully",
    });
  } catch (err) {
    console.error("[RegistrationController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function cancelRegistration(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid registration id" });
    }

    const registration = await Registration.findById(id)
      .populate("event", "title fees isFree registrationTypes")
      .populate("user", "name");

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    const ownerId = registration.user?._id || registration.user;
    const isOwner = ownerId && String(ownerId) === String(req.user._id);

    if (!isOwner) {
      const rt = registration.registrationType || "solo";
      if (rt === "duo" || rt === "squad") {
        const leader = await User.findById(registration.user).select("name").lean();
        const leaderName = leader?.name || "the team leader";
        return res.status(403).json({
          success: false,
          message: `Only the team leader can cancel a team registration. Contact ${leaderName} to cancel.`,
        });
      }
      return res.status(403).json({ success: false, message: "Not authorized to cancel this registration" });
    }

    if (
      (registration.registrationType === "duo" || registration.registrationType === "squad") &&
      registration.isTeamLeader === false
    ) {
      const leader = await User.findById(registration.user).select("name").lean();
      const leaderName = leader?.name || "the team leader";
      return res.status(403).json({
        success: false,
        message: `Only the team leader can cancel a team registration. Contact ${leaderName} to cancel.`,
      });
    }

    if (registration.status !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "This registration is not active and cannot be cancelled.",
      });
    }

    const isPaid = registrationIsPaid(registration, registration.event);
    await restoreSeatsForRegistrationDoc(registration);

    if (isPaid) {
      registration.status = "revoked";
      registration.paymentStatus = "revoked";
      registration.paymentRevokedAt = new Date();
    } else {
      registration.status = "cancelled";
    }
    await registration.save();

    const eventName = registration.event?.title || "the event";
    const tn = (registration.teamName || "").trim() || "Your team";
    if (registration.registrationType === "duo" || registration.registrationType === "squad") {
      const teammateIds = (registration.teammates || [])
        .filter((t) => t.status === "confirmed" && t.userId)
        .map((t) => t.userId);
      if (teammateIds.length > 0) {
        await createUserNotifications(teammateIds, {
          type: "team_registration_cancelled",
          title: "Team registration cancelled",
          message: `The team '${tn}' registration for ${eventName} has been cancelled by the team leader.`,
          link: "/student/my-registrations",
        });
      }
    }

    const populated = await Registration.findById(registration._id)
      .populate(
        "event",
        "title location eventDate fees isFree registrationTypes teamSize upiId upiQrImageUrl slug"
      )
      .select("-__v")
      .lean();

    return res.status(200).json({
      success: true,
      data: populated,
      message: "Registration cancelled successfully.",
    });
  } catch (err) {
    console.error("[RegistrationController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function revokeRegistrationPayment(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid registration id" });
    }

    const registration = await Registration.findById(id).populate(
      "event",
      "title fees isFree registrationTypes"
    );
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }
    const isPaid = registrationIsPaid(registration, registration.event);
    if (!isPaid) {
      return res
        .status(400)
        .json({ success: false, message: "Only paid registrations can be revoked." });
    }

    if (registration.status === "confirmed") {
      await restoreSeatsForRegistrationDoc(registration);
    }

    registration.status = "revoked";
    registration.paymentStatus = "revoked";
    registration.paymentRevokedAt = new Date();
    await registration.save();

    return res.status(200).json({
      success: true,
      data: registration,
      message: "Registration payment revoked successfully.",
    });
  } catch (err) {
    console.error("[RegistrationController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function listEventParticipants(req, res) {
  try {
    const { eventId } = req.params;
    const { search = "", status = "all", page = "1", limit = "25" } = req.query;

    const resolvedEventId = await resolveEventObjectId(eventId);
    if (!resolvedEventId) {
      return res.status(400).json({ success: false, message: "Invalid event id" });
    }

    const event = await Event.findById(resolvedEventId)
      .select(
        "title fees isFree registrationTypes teamSize eventDate startTime endTime location upiId"
      )
      .lean();
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 25));

    const query = { event: resolvedEventId };
    if (status && status !== "all") query.status = status;

    if (search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(escaped, "i");
      const users = await User.find({
        $or: [{ name: rx }, { email: rx }, { studentId: rx }],
      })
        .select("_id")
        .lean();
      const userIds = users.map((u) => u._id);
      query.$or = [
        { user: { $in: userIds } },
        { "teammates.email": rx },
        { "teammates.enrollmentId": rx },
        { teamName: rx },
      ];
    }

    const [total, docs] = await Promise.all([
      Registration.countDocuments(query),
      Registration.find(query)
        .populate("user", "name email studentId")
        .sort({ createdAt: 1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items: docs,
        total,
        page: safePage,
        pages: Math.max(1, Math.ceil(total / safeLimit)),
        limit: safeLimit,
        event,
      },
    });
  } catch (err) {
    console.error("[RegistrationController]", err);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function removeParticipant(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid registration id" });
    }
    const registration = await Registration.findById(id).populate(
      "event",
      "fees isFree registrationTypes"
    );
    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }
    const isPaid = registrationIsPaid(registration, registration.event);
    if (registration.status === "confirmed") {
      await restoreSeatsForRegistrationDoc(registration);
    }
    if (isPaid) {
      registration.status = "revoked";
      registration.paymentStatus = "revoked";
      registration.paymentRevokedAt = new Date();
    } else {
      registration.status = "cancelled";
    }
    await registration.save();
    return res.status(200).json({
      success: true,
      data: registration,
      message: "Participant removed successfully.",
    });
  } catch (err) {
    console.error("[RegistrationController]", err);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function bulkRemoveParticipants(req, res) {
  try {
    const { eventId } = req.params;
    const ids = Array.isArray(req.body?.registrationIds) ? req.body.registrationIds : [];
    const resolvedEventId = await resolveEventObjectId(eventId);
    if (!resolvedEventId) {
      return res.status(400).json({ success: false, message: "Invalid event id" });
    }
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: "No participants selected." });
    }

    const event = await Event.findById(resolvedEventId)
      .select("fees isFree registrationTypes")
      .lean();
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const regs = await Registration.find({
      _id: { $in: validIds },
      event: resolvedEventId,
    }).lean();

    let seatRestore = 0;
    for (const r of regs) {
      if (r.status === "confirmed") {
        seatRestore += r.seatsConsumed || 1;
      }
    }
    if (seatRestore > 0) {
      await Event.findByIdAndUpdate(resolvedEventId, { $inc: { availableSeats: seatRestore } });
    }

    for (const r of regs) {
      const isPaid = Number(r.amountPaid || 0) > 0 || feeForRegistrationType(event, r.registrationType) > 0;
      const update = isPaid
        ? { status: "revoked", paymentStatus: "revoked", paymentRevokedAt: new Date() }
        : { status: "cancelled" };
      await Registration.updateOne({ _id: r._id }, { $set: update });
    }

    return res.status(200).json({
      success: true,
      data: { modifiedCount: regs.length },
      message: "Participants removed successfully.",
    });
  } catch (err) {
    console.error("[RegistrationController]", err);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function exportParticipantsCsv(req, res) {
  try {
    const { eventId } = req.params;
    const resolvedEventId = await resolveEventObjectId(eventId);
    if (!resolvedEventId) {
      return res.status(400).json({ success: false, message: "Invalid event id" });
    }
    const event = await Event.findById(resolvedEventId).select("title fees isFree registrationTypes").lean();
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    const anyPaid =
      (Array.isArray(event.registrationTypes) ? event.registrationTypes : ["solo"]).some(
        (t) => feeForRegistrationType(event, t) > 0
      );

    const rows = await Registration.find({ event: resolvedEventId })
      .populate("user", "name email")
      .sort({ createdAt: 1 })
      .lean();

    const escapeCsv = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const teammateSummary = (row) => {
      const list = row.teammates || [];
      const confirmed = list.filter((t) => t.status === "confirmed").length;
      return `${confirmed}/${list.length} confirmed`;
    };

    const headers = anyPaid
      ? [
          "S.No",
          "Type",
          "Team Name",
          "Leader Name",
          "Leader Email",
          "Teammates",
          "UTR",
          "Amount Paid",
          "Registered At",
        ]
      : [
          "S.No",
          "Type",
          "Team Name",
          "Leader Name",
          "Leader Email",
          "Teammates",
          "Registered At",
        ];
    const lines = [headers.join(",")];

    rows.forEach((row, idx) => {
      const base = [
        escapeCsv(idx + 1),
        escapeCsv(row.registrationType || "solo"),
        escapeCsv(row.teamName || ""),
        escapeCsv(row.user?.name || ""),
        escapeCsv(row.user?.email || ""),
        escapeCsv(teammateSummary(row)),
      ];
      if (anyPaid) {
        base.push(escapeCsv(row.utrNumber || ""));
        base.push(escapeCsv(row.amountPaid ?? ""));
      }
      base.push(escapeCsv(row.registeredAt ? new Date(row.registeredAt).toISOString() : ""));
      lines.push(base.join(","));
    });

    const safeTitle = (event.title || "event").replace(/[^a-z0-9-_]+/gi, "-");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${safeTitle}-participants.csv\"`);
    return res.status(200).send(lines.join("\n"));
  } catch (err) {
    console.error("[RegistrationController]", err);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

