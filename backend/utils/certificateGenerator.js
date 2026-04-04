import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateCertificatePdfFromEventTemplate } from "./pdfCertificateGenerator.js";
import Certificate from "../models/Certificate.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import { detectMeritSuggestions } from "./smartMeritDetector.js";
import { createUserNotification } from "./notifications.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");

function eventUsesPdfTemplates(event) {
  return !!(event?.meritTemplateUrl || event?.participationTemplateUrl);
}

function templateSlotForCertType(type) {
  return type === "participation" ? "participation" : "merit";
}

function writeGeneratedCertificatePdf(eventId, studentId, certType, pdfBuffer) {
  const certDir = path.join(UPLOADS_ROOT, "certificates", String(eventId));
  fs.mkdirSync(certDir, { recursive: true });
  const certFilename = `${studentId}_${certType}_${Date.now()}.pdf`;
  const certPath = path.join(certDir, certFilename);
  fs.writeFileSync(certPath, pdfBuffer);
  return `/uploads/certificates/${eventId}/${certFilename}`;
}

export async function processBatchGeneration(eventId, options = {}, io) {
  const {
    automationMode,
    meritStudents = [],
    confirmedStudentIds,
    issuedBy,
  } = options;

  if (!eventId) {
    throw new Error("eventId is required");
  }

  const event = await Event.findById(eventId).populate("clubId", "name").exec();
  if (!event) {
    throw new Error("Event not found");
  }

  let registrations = await Registration.find({
    event: eventId,
    status: "confirmed",
    attendanceStatus: "present",
  })
    .populate("user", "name email studentId")
    .exec();

  registrations = registrations.filter((reg) => reg.user);

  if (confirmedStudentIds?.length) {
    const confirmedSet = new Set(confirmedStudentIds.map((id) => String(id)));
    registrations = registrations.filter((reg) =>
      confirmedSet.has(String(reg.user._id))
    );
  }

  const suggestions = await detectMeritSuggestions(
    eventId,
    registrations.map((r) => r.user._id)
  );
  const suggestionsByStudentId = new Map(
    suggestions.map((s) => [String(s.studentId), s])
  );

  const total = registrations.length;

  io?.to(`event:${String(eventId)}`).emit("certificate:theatre", {
    eventId,
    status: "started",
    total,
    message: "Certificate generation started!",
  });

  let generated = 0;
  let failed = 0;

  const usePdfPath = eventUsesPdfTemplates(event);

  for (const reg of registrations) {
    const student = reg.user;
    let cert = null;

    try {
      const suggestion = suggestionsByStudentId.get(String(student._id));
      const override =
        meritStudents.find(
          (m) => String(m.userId) === String(student._id)
        ) || null;

      let type;
      let rank = null;
      let achievement;

      if (override) {
        type = override.type || "merit";
        rank = override.rank || null;
        achievement =
          override.achievement ||
          (rank ? `secured ${rank} Position` : "demonstrated exceptional performance");
      } else {
        type = suggestion?.suggestion || "participation";
        rank = null;
        achievement =
          type === "participation"
            ? "successfully participated and completed"
            : "demonstrated exceptional performance";
      }

      const existing = await Certificate.findOne({
        studentId: student._id,
        eventId,
        recipientType: { $nin: ["club_member"] },
      }).exec();

      if (existing && existing.status === "generated") {
        generated += 1;
        continue;
      }

      cert =
        existing ||
        new Certificate({
          studentId: student._id,
          eventId,
          issuedBy: issuedBy || null,
          recipientType: "participant",
          type,
          rank,
          achievement,
          meritScore: suggestion?.meritScore ?? 0,
          meritSuggestion: suggestion?.suggestion ?? null,
          meritSuggestionReason: suggestion?.reason ?? undefined,
          snapshot: {
            studentName: student.name,
            studentEmail: student.email,
            studentRollNo: student.studentId,
            eventTitle: event.title,
            eventDate: new Date(event.eventDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            eventCategory: event.status || "",
            clubName: event.clubId?.name || "MITS",
            issuerName: "MITS Gwalior",
          },
        });

      if (!cert.recipientType) cert.recipientType = "participant";

      cert.status = "generating";
      cert.generationStartedAt = new Date();
      await cert.save();

      io?.to(`event:${String(eventId)}`).emit("certificate:theatre", {
        eventId,
        studentId: String(student._id),
        status: "generating",
        studentName: student.name,
        generated,
        processed: generated,
        total,
        percent: total > 0 ? Math.round((generated / total) * 100) : 0,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      let pdfUrl;
      let thumbnailUrl;

      if (!usePdfPath) {
        throw new Error(
          "No PDF template uploaded for this event. Upload a merit and/or participation PDF template first."
        );
      }
      const slot = templateSlotForCertType(type);
      const pdfBuffer = await generateCertificatePdfFromEventTemplate({
        event,
        certificate: cert,
        student,
        templateSlot: slot,
      });
      pdfUrl = writeGeneratedCertificatePdf(eventId, student._id, type, pdfBuffer);
      thumbnailUrl = null;

      cert.pdfUrl = pdfUrl;
      if (thumbnailUrl) {
        cert.thumbnailUrl = thumbnailUrl;
      }
      cert.status = "generated";
      cert.generationCompletedAt = new Date();
      await cert.save();

      await createUserNotification({
        userId: student._id,
        type: "certificate_ready",
        title: "Your certificate is ready!",
        message: `Your certificate for ${event.title} is now available to download.`,
        link: "/student/certificates",
      });

      io?.to(`event:${String(eventId)}`).emit("certificate:theatre", {
        eventId,
        studentId: String(student._id),
        status: "ready",
        studentName: student.name,
        certificateId: cert.certificateId,
        message: "Certificate ready!",
        generated: generated + 1,
        processed: generated + 1,
        total,
        percent: total > 0 ? Math.round(((generated + 1) / total) * 100) : 0,
      });

      generated += 1;
    } catch (err) {
      console.error("[certificateGenerator] error:", err);
      failed += 1;
      if (cert) {
        cert.status = "failed";
        cert.failureReason =
          process.env.NODE_ENV === "development" ? (err.message || "Certificate generation failed") : "Certificate generation failed";
        try {
          await cert.save();
        } catch {
          // ignore secondary errors
        }
      }
    }
  }

  io?.to(`event:${String(eventId)}`).emit("certificate:theatre", {
    eventId,
    status: "completed",
    generated,
    failed,
    total,
    message: `✅ ${generated} certificates generated!`,
  });

  return { generated, failed, total };
}

export async function processClubMemberBatchGeneration(eventId, options = {}, io) {
  const { members = [], issuedBy } = options;

  if (!eventId) throw new Error("eventId is required");
  if (!members.length) throw new Error("No members provided");

  const event = await Event.findById(eventId).populate("clubId", "name").exec();
  if (!event) throw new Error("Event not found");

  if (!event.meritTemplateUrl && !event.participationTemplateUrl) {
    throw new Error(
      "No PDF template uploaded for this event. Upload a PDF template first."
    );
  }

  const total = members.length;
  let generated = 0;
  let failed = 0;

  io?.to(`event:${String(eventId)}`).emit("certificate:theatre", {
    eventId,
    status: "started",
    total,
    message: "Club member certificate generation started!",
  });

  for (const m of members) {
    let cert = null;
    try {
      const student = { _id: m.userId, name: m.name, email: m.email, studentId: m.rollNo };
      const type = m.type || "participation";
      const rank = m.rank || null;

      const existing = await Certificate.findOne({
        studentId: m.userId,
        eventId,
        recipientType: "club_member",
      }).exec();

      if (existing && existing.status === "generated") {
        generated += 1;
        continue;
      }

      cert = existing || new Certificate({
        studentId: m.userId,
        eventId,
        issuedBy: issuedBy || null,
        recipientType: "club_member",
        type,
        rank,
        achievement: rank
          ? `secured ${rank} Position`
          : type === "participation"
          ? "contributed as a club member"
          : "demonstrated exceptional contribution",
        snapshot: {
          studentName: m.name,
          studentEmail: m.email,
          studentRollNo: m.rollNo || "",
          eventTitle: event.title,
          eventDate: new Date(event.eventDate).toLocaleDateString("en-IN", {
            day: "numeric", month: "long", year: "numeric",
          }),
          eventCategory: event.status || "",
          clubName: event.clubId?.name || "MITS",
          issuerName: "MITS Gwalior",
          memberRole: m.clubRole || "",
        },
      });

      cert.status = "generating";
      cert.generationStartedAt = new Date();
      await cert.save();

      io?.to(`event:${String(eventId)}`).emit("certificate:theatre", {
        eventId,
        studentId: String(m.userId),
        status: "generating",
        studentName: m.name,
        generated,
        processed: generated,
        total,
        percent: total > 0 ? Math.round((generated / total) * 100) : 0,
      });

      await new Promise((resolve) => setTimeout(resolve, 600));

      const slot = type === "participation" ? "participation" : "merit";
      const pdfBuffer = await generateCertificatePdfFromEventTemplate({
        event,
        certificate: cert,
        student,
        templateSlot: slot,
      });
      const pdfUrl = writeGeneratedCertificatePdf(eventId, m.userId, `member_${type}`, pdfBuffer);

      cert.pdfUrl = pdfUrl;
      cert.status = "generated";
      cert.generationCompletedAt = new Date();
      await cert.save();

      await createUserNotification({
        userId: m.userId,
        type: "certificate_ready",
        title: "Your club member certificate is ready!",
        message: `Your certificate for ${event.title} is now available.`,
        link: "/student/certificates",
      });

      io?.to(`event:${String(eventId)}`).emit("certificate:theatre", {
        eventId,
        studentId: String(m.userId),
        status: "ready",
        studentName: m.name,
        certificateId: cert.certificateId,
        message: "Certificate ready!",
        generated: generated + 1,
        processed: generated + 1,
        total,
        percent: total > 0 ? Math.round(((generated + 1) / total) * 100) : 0,
      });

      generated += 1;
    } catch (err) {
      console.error("[certificateGenerator] club member error:", err);
      failed += 1;
      if (cert) {
        cert.status = "failed";
        cert.failureReason = process.env.NODE_ENV === "development"
          ? (err.message || "Failed") : "Certificate generation failed";
        try { await cert.save(); } catch { /* ignore */ }
      }
    }
  }

  io?.to(`event:${String(eventId)}`).emit("certificate:theatre", {
    eventId,
    status: "completed",
    generated,
    failed,
    total,
    message: `✅ ${generated} club member certificates generated!`,
  });

  return { generated, failed, total };
}

