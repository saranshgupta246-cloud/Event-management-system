import Certificate from "../models/Certificate.js";
import CertificateTemplate from "../models/CertificateTemplate.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import { detectMeritSuggestions } from "../utils/smartMeritDetector.js";
import { generateCertificatePDF, processBatchGeneration } from "../utils/certificateGenerator.js";
import cloudinary from "../config/cloudinary.js";

function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

async function getEligibleRegistrations(eventId) {
  const regs = await Registration.find({
    event: eventId,
    status: "confirmed",
  })
    .populate("user", "name email studentId")
    .exec();

  return regs.filter((r) => r.user);
}

export async function initiateGeneration(req, res, next) {
  try {
    const { eventId } = req.params;
    const { templateId, automationMode, meritStudents = [], confirmedStudentIds = [] } = req.body || {};

    const registrations = await getEligibleRegistrations(eventId);
    const total = registrations.length;

    const io = req.app.get("io");

    if (automationMode === "manual") {
      const studentIds = registrations.map((r) => r.user._id);
      const suggestions = await detectMeritSuggestions(eventId, studentIds);
      const suggestionsById = new Map(suggestions.map((s) => [String(s.studentId), s]));

      const students = registrations.map((reg) => {
        const student = reg.user;
        const s = suggestionsById.get(String(student._id));
        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          rollNo: student.studentId,
          meritScore: s?.meritScore ?? 0,
          suggestion: s?.suggestion ?? "participation",
          suggestionReason: s?.reason ?? "",
          breakdown: s?.breakdown ?? { attendance: 0, quiz: 0, submission: 0 },
        };
      });

      return res.status(200).json({
        success: true,
        data: { students, total },
        message: "Merit suggestions generated",
      });
    }

    // Default to auto generation
    processBatchGeneration(
      eventId,
      {
        templateId,
        automationMode: automationMode || "auto",
        meritStudents,
        confirmedStudentIds,
        issuedBy: req.user?._id || null,
      },
      io
    ).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("processBatchGeneration error:", err);
    });

    return res.status(202).json({
      success: true,
      data: { total },
      message: "Generation started",
    });
  } catch (err) {
    console.error("[CertificateController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getEligibleStudents(req, res, next) {
  try {
    const { eventId } = req.params;
    const registrations = await getEligibleRegistrations(eventId);

    const studentIds = registrations.map((r) => r.user._id);

    const [suggestions, existingCerts] = await Promise.all([
      detectMeritSuggestions(eventId, studentIds),
      Certificate.find({
        eventId,
        studentId: { $in: studentIds },
      })
        .select("studentId type")
        .lean()
        .exec(),
    ]);

    const suggestionsById = new Map(
      suggestions.map((s) => [String(s.studentId), s])
    );
    const certByStudent = new Map(
      existingCerts.map((c) => [String(c.studentId), c])
    );

    const result = registrations.map((reg) => {
      const student = reg.user;
      const sid = String(student._id);
      const suggestion = suggestionsById.get(sid);
      const cert = certByStudent.get(sid);

      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        rollNo: student.studentId,
        hasCertificate: !!cert,
        existingType: cert?.type ?? null,
        meritScore: suggestion?.meritScore ?? 0,
        suggestion: suggestion?.suggestion ?? "participation",
        suggestionReason: suggestion?.reason ?? "",
        breakdown: suggestion?.breakdown ?? {
          attendance: 0,
          quiz: 0,
          submission: 0,
        },
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: "Eligible students fetched successfully",
    });
  } catch (err) {
    console.error("[CertificateController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getEventCertificates(req, res, next) {
  try {
    const { eventId } = req.params;
    const { status, page = 1, limit = 20, search } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const filter = { eventId };

    if (status) {
      filter.status = status;
    }

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { "snapshot.studentName": regex },
        { "snapshot.studentEmail": regex },
      ];
    }

    const [items, total, totalGenerated, totalPending, totalFailed] =
      await Promise.all([
        Certificate.find(filter)
          .populate("studentId", "name email")
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean()
          .exec(),
        Certificate.countDocuments(filter).exec(),
        Certificate.countDocuments({ ...filter, status: "generated" }).exec(),
        Certificate.countDocuments({ ...filter, status: "pending" }).exec(),
        Certificate.countDocuments({ ...filter, status: "failed" }).exec(),
      ]);

    const pages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: {
        items,
        page: pageNum,
        limit: limitNum,
        total,
        totalGenerated,
        totalPending,
        totalFailed,
        pages,
      },
      message: "Event certificates fetched successfully",
    });
  } catch (err) {
    console.error("[CertificateController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getStudentCertificates(req, res, next) {
  try {
    const certs = await Certificate.find({
      studentId: req.user._id,
      status: { $in: ["generated", "sent"] },
    })
      .populate("eventId", "title eventDate status imageUrl")
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return res.status(200).json({
      success: true,
      data: certs,
      message: "Certificates fetched successfully",
    });
  } catch (err) {
    console.error("[CertificateController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function verifyCertificate(req, res, next) {
  try {
    const { verificationId } = req.params;

    const cert = await Certificate.findOne({ verificationId }).exec();
    if (!cert) {
      return res.status(200).json({ valid: false });
    }

    const ipHeader = req.headers["x-forwarded-for"];
    const ip =
      (Array.isArray(ipHeader) ? ipHeader[0] : ipHeader)?.split(",")[0]?.trim() ||
      req.ip ||
      "";

    let country = "";
    let city = "";

    try {
      if (ip) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const resp = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (resp.ok) {
          const data = await resp.json();
          country = data.country_name || data.country || "";
          city = data.city || "";
        }
      }
    } catch {
      // ignore location lookup failures
    }

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    cert.verifiedCount = (cert.verifiedCount || 0) + 1;
    cert.lastVerifiedAt = now;

    cert.verificationLogs = cert.verificationLogs || [];
    cert.verificationLogs.push({
      verifiedAt: now,
      ipAddress: ip,
      country,
      city,
      userAgent: req.headers["user-agent"] || "",
      referrer: req.headers.referer || "",
    });
    if (cert.verificationLogs.length > 100) {
      cert.verificationLogs = cert.verificationLogs.slice(-100);
    }

    cert.monthlyVerifications = cert.monthlyVerifications || [];
    const existingMonth = cert.monthlyVerifications.find(
      (m) => m.month === monthKey
    );
    if (existingMonth) {
      existingMonth.count = (existingMonth.count || 0) + 1;
    } else {
      cert.monthlyVerifications.push({ month: monthKey, count: 1 });
    }

    await cert.save();

    const { snapshot } = cert;

    return res.status(200).json({
      valid: true,
      studentName: snapshot?.studentName || "",
      studentRollNo: snapshot?.studentRollNo || "",
      eventTitle: snapshot?.eventTitle || "",
      eventDate: snapshot?.eventDate || "",
      type: cert.type,
      rank: cert.rank,
      achievement: cert.achievement,
      issuedAt: cert.createdAt,
      certificateId: cert.certificateId,
      pdfUrl: cert.pdfUrl,
      verifiedCount: cert.verifiedCount,
      issuer: "Madhav Institute of Technology & Science, Gwalior",
    });
  } catch (err) {
    console.error("[CertificateController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getCertificateAnalytics(req, res, next) {
  try {
    const { id } = req.params;
    const cert = await Certificate.findById(id).exec();

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
        data: null,
      });
    }

    if (
      req.user.role === "student" &&
      String(cert.studentId) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        data: null,
      });
    }

    const logs = cert.verificationLogs || [];
    const countryCounts = new Map();

    for (const log of logs) {
      const key = log.country || "Unknown";
      countryCounts.set(key, (countryCounts.get(key) || 0) + 1);
    }

    const topCountries = Array.from(countryCounts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      data: {
        totalVerifications: cert.verifiedCount || 0,
        lastVerifiedAt: cert.lastVerifiedAt || null,
        monthlyData: cert.monthlyVerifications || [],
        topCountries,
        downloadCount: cert.downloadCount || 0,
      },
      message: "Certificate analytics fetched successfully",
    });
  } catch (err) {
    console.error("[CertificateController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function downloadCertificate(req, res, next) {
  try {
    const { id } = req.params;
    const cert = await Certificate.findById(id).exec();

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
        data: null,
      });
    }

    if (
      req.user.role === "student" &&
      String(cert.studentId) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
        data: null,
      });
    }

    cert.downloadCount = (cert.downloadCount || 0) + 1;
    await cert.save();

    return res.status(200).json({
      success: true,
      data: { pdfUrl: cert.pdfUrl },
      message: "Download recorded",
    });
  } catch (err) {
    console.error("[CertificateController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

async function regenerateCertificatePdf(cert) {
  const event = await Event.findById(cert.eventId)
    .populate("clubId", "name")
    .exec();
  if (!event) {
    throw new Error("Event not found for certificate");
  }

  let templateDoc = null;

  if (cert.templateId) {
    templateDoc = await CertificateTemplate.findById(cert.templateId).exec();
  }

  if (!templateDoc) {
    throw new Error("Template not found for certificate");
  }

  const student = {
    name: cert.snapshot?.studentName || "",
  };

  const { pdfUrl, thumbnailUrl } = await generateCertificatePDF(
    cert,
    templateDoc,
    student
  );

  cert.pdfUrl = pdfUrl;
  if (thumbnailUrl) {
    cert.thumbnailUrl = thumbnailUrl;
  }
  cert.generationCompletedAt = new Date();
}

export async function updateCertificateType(req, res, next) {
  try {
    const { id } = req.params;
    const { type, rank, achievement } = req.body || {};

    const allowedTypes = ["participation", "merit", "winner", "completion"];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid certificate type",
      });
    }

    const cert = await Certificate.findById(id).exec();
    if (!cert) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found",
        data: null,
      });
    }

    if (type) {
      cert.type = type;
    }
    if (rank !== undefined) {
      cert.rank = rank || null;
    }
    if (achievement) {
      cert.achievement = achievement;
    }

    cert.generationStartedAt = new Date();

    if (cert.status === "generated") {
      await regenerateCertificatePdf(cert);
    }

    await cert.save();

    return res.status(200).json({
      success: true,
      data: cert,
      message: "Certificate updated successfully",
    });
  } catch (err) {
    console.error("[CertificateController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getTemplates(req, res, next) {
  try {
    const templates = await CertificateTemplate.find({ isActive: true }).lean().exec();

    return res.status(200).json({
      success: true,
      data: templates,
      message: "Templates fetched successfully",
    });
  } catch (err) {
    console.error("[CertificateController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function createTemplate(req, res, next) {
  try {
    const { name, description, category, imageUrl } = req.body || {};

    if (!name || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Name and imageUrl are required",
        data: null,
      });
    }

    const template = await CertificateTemplate.create({
      name: name.trim(),
      description: description || undefined,
      category: category || "custom",
      imageUrl,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      data: template,
      message: "Template created successfully",
    });
  } catch (err) {
    console.error("[CertificateController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

// Upload template image
export async function uploadTemplate(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Certificate image is required",
      });
    }

    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG and PNG files allowed",
      });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum 5MB allowed",
      });
    }

    const {
      name,
      description,
      category,
      namePosition,
      nameStyle,
      showQR,
      showVerificationId,
      qrPosition,
      qrSize,
      verificationIdPosition,
      eventId,
    } = req.body || {};

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "mits-certificate-templates",
          resource_type: "image",
          format: "png",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const template = await CertificateTemplate.create({
      name: name || "Custom Template",
      description,
      category: category || "custom",
      imageUrl: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
      namePosition: safeJsonParse(namePosition, { x: 50, y: 55 }),
      nameStyle: safeJsonParse(nameStyle, {
        fontSize: 64,
        fontFamily: "serif",
        color: "#1a1a2e",
        align: "center",
      }),
      showQR: showQR !== "false",
      showVerificationId: showVerificationId !== "false",
      qrPosition: safeJsonParse(qrPosition, { x: 85, y: 85 }),
      qrSize: parseInt(qrSize, 10) || 80,
      verificationIdPosition: safeJsonParse(verificationIdPosition, { x: 50, y: 92 }),
      eventId: eventId || null,
      createdBy: req.user._id,
      imageWidth: uploadResult.width,
      imageHeight: uploadResult.height,
    });

    return res.status(201).json({
      success: true,
      data: template,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

// Preview endpoint — returns base64 PNG
export async function previewTemplate(req, res) {
  try {
    const { templateId, testName } = req.query || {};

    const template = await CertificateTemplate.findById(templateId).exec();
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    const safeName = (testName || "Rahul Sharma")
      .replace(/[<>'"&]/g, "")
      .trim()
      .slice(0, 100);

    const { previewCertificate } = await import("../utils/imageGenerator.js");

    const base64 = await previewCertificate(
      template.imageUrl,
      safeName,
      template.namePosition,
      template.nameStyle,
      template.imageWidth,
      template.imageHeight
    );

    return res.status(200).json({
      success: true,
      data: { preview: `data:image/png;base64,${base64}` },
    });
  } catch (err) {
    console.error("Preview error:", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

