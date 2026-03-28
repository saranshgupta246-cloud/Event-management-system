import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateCertificateImage } from "./imageGenerator.js";
import { generateCertificatePdfFromEventTemplate } from "./pdfCertificateGenerator.js";
import Certificate from "../models/Certificate.js";
import CertificateTemplate from "../models/CertificateTemplate.js";
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

export async function generateCertificatePDF(certificate, template, student) {
  return generateCertificateImage(certificate, template, student);
}

export async function processBatchGeneration(eventId, options = {}, io) {
  const {
    templateId,
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

  let templateDoc = null;
  let template = null;

  if (templateId) {
    templateDoc = await CertificateTemplate.findById(templateId).exec();
  }

  if (templateDoc) {
    template = templateDoc;
  } else {
    const defaults = CertificateTemplate.getDefaultTemplates();
    template = defaults[0];
  }

  let registrations = await Registration.find({
    event: eventId,
    status: "confirmed",
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

  io?.emit("certificate:theatre", {
    eventId,
    status: "started",
    total,
    message: "Certificate generation started!",
  });

  let generated = 0;
  let failed = 0;

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

      if (!usePdfPath && templateDoc?._id && !cert.templateId) {
        cert.templateId = templateDoc._id;
      }

      cert.status = "generating";
      cert.generationStartedAt = new Date();
      await cert.save();

      io?.emit("certificate:theatre", {
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

      if (usePdfPath) {
        const slot = templateSlotForCertType(type);
        const pdfBuffer = await generateCertificatePdfFromEventTemplate({
          event,
          certificate: cert,
          student,
          templateSlot: slot,
        });
        pdfUrl = writeGeneratedCertificatePdf(eventId, student._id, type, pdfBuffer);
        thumbnailUrl = null;
      } else {
        const out = await generateCertificatePDF(cert, template, student);
        pdfUrl = out.pdfUrl;
        thumbnailUrl = out.thumbnailUrl;
      }

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

      io?.emit("certificate:theatre", {
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

  io?.emit("certificate:theatre", {
    eventId,
    status: "completed",
    generated,
    failed,
    total,
    message: `✅ ${generated} certificates generated!`,
  });

  return { generated, failed, total };
}

