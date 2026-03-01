import mongoose from "mongoose";
import Application from "../models/Application.js";
import RecruitmentDrive from "../models/RecruitmentDrive.js";
import ClubMember from "../models/ClubMember.js";
import EmailLog from "../models/EmailLog.js";
import User from "../models/User.js";
import { sendEmail, replacePlaceholders } from "../utils/email.js";
import { createUserNotification, createUserNotifications } from "../utils/notifications.js";

const APPLICATION_STATUSES = ["pending", "shortlisted", "interview", "selected", "rejected", "withdrawn"];
const VALID_TRANSITIONS = {
  pending: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["selected", "rejected"],
  selected: [],
  rejected: [],
  withdrawn: [],
};

async function canAccessApplication(userId, application, clubMemberOrNull) {
  const appId = application.applicantId && (application.applicantId._id || application.applicantId);
  if (appId && appId.toString() === userId.toString()) return true;
  const clubId = application.clubId && (application.clubId._id || application.clubId);
  if (clubMemberOrNull && clubMemberOrNull.clubId && clubId &&
      clubMemberOrNull.clubId.toString() === clubId.toString() &&
      clubMemberOrNull.roleRank <= 4 && clubMemberOrNull.status === "active") return true;
  return false;
}

async function loadApplicationAndCheckAccess(req, res, next, options = {}) {
  const { allowStudentOnly } = options;
  try {
    const applicationId = req.params.applicationId;
    if (!applicationId || !mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ success: false, message: "Invalid application ID", data: null });
    }
    const application = await Application.findById(applicationId)
      .populate("driveId", "title roleTitle deadline status clubId")
      .populate("applicantId", "name email avatar studentId department year")
      .populate("clubId", "name logoUrl");
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found", data: null });
    }
    const isApplicant = req.user._id && application.applicantId._id &&
      application.applicantId._id.toString() === req.user._id.toString();
    let clubMember = null;
    if (req.user._id && application.clubId) {
      clubMember = await ClubMember.findOne({
        clubId: application.clubId._id || application.clubId,
        userId: req.user._id,
        status: "active",
      });
    }
    const allowed = await canAccessApplication(req.user._id, application, clubMember);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied", data: null });
    }
    if (allowStudentOnly && !isApplicant) {
      return res.status(403).json({ success: false, message: "Students only for this action", data: null });
    }
    req.application = application;
    req.applicationIsOwn = isApplicant;
    req.applicationClubMember = clubMember;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireApplicationAccess(options = {}) {
  return (req, res, next) => loadApplicationAndCheckAccess(req, res, next, options);
}

export function requireApplicationClubMember(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });
  loadApplicationAndCheckAccess(req, res, (err) => {
    if (err) return next(err);
    if (req.applicationIsOwn) return next();
    if (!req.applicationClubMember || req.applicationClubMember.roleRank > 4) {
      return res.status(403).json({ success: false, message: "Club members only", data: null });
    }
    next();
  }, {});
}

export async function apply(req, res, next) {
  try {
    const { driveId } = req.params;
    const { answers, resumeUrl, portfolioUrl } = req.body || {};
    const drive = await RecruitmentDrive.findById(driveId).populate("clubId", "name");
    if (!drive) {
      return res.status(404).json({ success: false, message: "Drive not found", data: null });
    }
    if (drive.status !== "open") {
      return res.status(400).json({ success: false, message: "Drive is not open for applications", data: null });
    }
    if (new Date(drive.deadline) <= new Date()) {
      return res.status(400).json({ success: false, message: "Application deadline has passed", data: null });
    }
    const existing = await Application.findOne({ driveId: drive._id, applicantId: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: "You have already applied", data: null });
    }
    if (drive.maxApplicants != null) {
      const count = await Application.countDocuments({ driveId: drive._id });
      if (count >= drive.maxApplicants) {
        return res.status(400).json({ success: false, message: "Maximum applicants reached", data: null });
      }
    }
    const requiredIds = (drive.customQuestions || [])
      .filter((q) => q.required)
      .map((q) => (q.questionId || q._id || "").toString());
    const answeredIds = (answers || []).map((a) => (a.questionId || "").toString());
    const missing = requiredIds.filter((id) => id && !answeredIds.includes(id));
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "All required questions must be answered",
        data: null,
      });
    }
    const application = await Application.create({
      driveId: drive._id,
      clubId: drive.clubId._id || drive.clubId,
      applicantId: req.user._id,
      answers: answers || [],
      resumeUrl: resumeUrl || undefined,
      portfolioUrl: portfolioUrl || undefined,
      status: "pending",
    });
    const clubId = drive.clubId._id || drive.clubId;
    const leaders = await ClubMember.find({ clubId, status: "active", roleRank: { $lte: 2 } })
      .select("userId")
      .lean();
    if (leaders.length > 0) {
      const applicantName = req.user.name || "A student";
      const roleName = drive.roleTitle || "a role";
      const clubName = drive.clubId?.name || "your club";
      await createUserNotifications(
        leaders.map((l) => l.userId),
        {
          type: "new_application",
          title: `New application — ${roleName} at ${clubName}`,
          message: `${applicantName} applied for ${roleName}.`,
          link: `/leader/clubs/${clubId}/drives/${drive._id}/applications`,
        }
      );
    }
    const populated = await Application.findById(application._id)
      .populate("driveId", "title roleTitle deadline status")
      .populate("clubId", "name logoUrl")
      .lean();
    return res.status(201).json({
      success: true,
      data: populated,
      message: "Application submitted successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyApplications(req, res, next) {
  try {
    const apps = await Application.find({ applicantId: req.user._id })
      .populate("driveId", "title roleTitle deadline status")
      .populate("clubId", "name logoUrl")
      .sort({ createdAt: -1 })
      .lean();
    const withHistory = apps.map((a) => ({
      ...a,
      enrollmentId: a.applicantId ? a.applicantId.studentId : undefined,
    }));
    return res.status(200).json({
      success: true,
      data: withHistory,
      message: "Applications fetched successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function listDriveApplications(req, res, next) {
  try {
    const { clubId, driveId } = req.params;
    const { status, search, page = 1, limit = 20, sortBy = "appliedAt" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const filter = {
      clubId: new mongoose.Types.ObjectId(clubId),
      driveId: new mongoose.Types.ObjectId(driveId),
    };
    if (status) filter.status = status;
    if (search && search.trim()) {
      const users = await User.find({ name: new RegExp(search.trim(), "i") }).select("_id").lean();
      const ids = users.map((u) => u._id);
      if (ids.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "Applications fetched successfully",
          pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
          statusCounts: {},
        });
      }
      filter.applicantId = { $in: ids };
    }
    const sort = sortBy === "rating" ? { rating: -1, createdAt: -1 } : { createdAt: -1 };
    const [applications, total, statusCounts] = await Promise.all([
      Application.find(filter)
        .populate("applicantId", "name email avatar studentId department year")
        .sort(sort)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Application.countDocuments(filter),
      Application.aggregate([
        { $match: { clubId: new mongoose.Types.ObjectId(clubId), driveId: new mongoose.Types.ObjectId(driveId) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);
    const counts = {};
    (statusCounts || []).forEach((s) => { counts[s._id] = s.count; });
    const data = applications.map((a) => ({
      ...a,
      enrollmentId: a.applicantId ? a.applicantId.studentId : undefined,
      branch: a.applicantId ? a.applicantId.department : undefined,
    }));
    const pages = Math.ceil(total / limitNum) || 1;
    return res.status(200).json({
      success: true,
      data,
      message: "Applications fetched successfully",
      pagination: { page: pageNum, limit: limitNum, total, pages },
      statusCounts: counts,
    });
  } catch (err) {
    next(err);
  }
}

export async function getApplicationById(req, res, next) {
  try {
    const application = await Application.findById(req.params.applicationId)
      .populate("driveId", "title roleTitle deadline status clubId customQuestions")
      .populate("applicantId", "name email avatar studentId department year")
      .populate("clubId", "name logoUrl")
      .populate("statusHistory.changedBy", "name")
      .lean();
    if (!application) {
      return res.status(404).json({ success: false, message: "Application not found", data: null });
    }
    const isOwn = req.user._id && application.applicantId && application.applicantId._id.toString() === req.user._id.toString();
    let clubMember = null;
    if (req.user._id && application.clubId) {
      clubMember = await ClubMember.findOne({
        clubId: application.clubId._id,
        userId: req.user._id,
        status: "active",
      });
    }
    const allowed = await canAccessApplication(req.user._id, application, clubMember);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied", data: null });
    }
    const emailLogs = await EmailLog.find({ applicationId: application._id })
      .populate("sentBy", "name email")
      .sort({ sentAt: -1 })
      .lean();
    return res.status(200).json({
      success: true,
      data: { ...application, emailLogs },
      message: "Application fetched successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function updateApplicationStatus(req, res, next) {
  try {
    const { status, note } = req.body || {};
    if (!status || !APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Valid status required", data: null });
    }
    const app = await Application.findById(req.params.applicationId);
    if (!app) return res.status(404).json({ success: false, message: "Application not found", data: null });
    const fromStatus = app.status;
    if (status === "withdrawn") {
      const applicantIdStr = (app.applicantId && (app.applicantId._id || app.applicantId)).toString();
      if (applicantIdStr !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Only applicant can withdraw", data: null });
      }
    } else {
      const allowed = VALID_TRANSITIONS[fromStatus] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${fromStatus} to ${status}`,
          data: null,
        });
      }
      const clubMember = await ClubMember.findOne({
        clubId: app.clubId,
        userId: req.user._id,
        status: "active",
      });
      if (!clubMember || clubMember.roleRank > 4) {
        return res.status(403).json({ success: false, message: "Club member access required", data: null });
      }
    }
    app.status = status;
    app.reviewedBy = status !== "withdrawn" ? req.user._id : app.reviewedBy;
    app.statusHistory = app.statusHistory || [];
    app.statusHistory.push({
      fromStatus,
      toStatus: status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note || undefined,
    });
    await app.save();
    const applicantId = app.applicantId && (app.applicantId._id || app.applicantId);
    if (applicantId) {
      const drive = await RecruitmentDrive.findById(app.driveId).select("roleTitle").populate("clubId", "name").lean();
      const clubName = drive?.clubId?.name || "Club";
      const roleName = drive?.roleTitle || "Role";
      const statusLabels = { shortlisted: "Shortlisted", interview: "Interview", selected: "Selected", rejected: "Rejected", withdrawn: "Withdrawn" };
      const title = statusLabels[status] ? `Application ${statusLabels[status]} — ${roleName} at ${clubName}` : `Application update — ${roleName} at ${clubName}`;
      await createUserNotification({
        userId: applicantId,
        type: "application_status",
        title,
        message: `Your application for ${roleName} at ${clubName} is now ${status}.`,
        link: "/student/my-applications",
      });
    }
    const populated = await Application.findById(app._id)
      .populate("applicantId", "name email avatar studentId department year")
      .populate("driveId", "title roleTitle deadline status")
      .populate("clubId", "name logoUrl")
      .populate("statusHistory.changedBy", "name")
      .lean();
    return res.status(200).json({
      success: true,
      data: populated,
      message: "Status updated successfully",
    });
  } catch (err) {
    next(err);
  }
}

export async function sendApplicationEmail(req, res, next) {
  try {
    const { subject, body: htmlBody, templateUsed } = req.body || {};
    if (!subject || !htmlBody) {
      return res.status(400).json({ success: false, message: "subject and body are required", data: null });
    }
    const app = await Application.findById(req.params.applicationId)
      .populate("applicantId", "name email")
      .populate("clubId", "name")
      .populate("driveId", "roleTitle");
    if (!app) return res.status(404).json({ success: false, message: "Application not found", data: null });
    const clubMember = await ClubMember.findOne({
      clubId: app.clubId._id || app.clubId,
      userId: req.user._id,
      status: "active",
    });
    if (!clubMember || clubMember.roleRank > 4) {
      return res.status(403).json({ success: false, message: "Club member access required", data: null });
    }
    const applicantName = app.applicantId ? app.applicantId.name : "Applicant";
    const applicantEmail = app.applicantId ? app.applicantId.email : null;
    if (!applicantEmail) {
      return res.status(400).json({ success: false, message: "Applicant has no email", data: null });
    }
    const clubName = app.clubId ? app.clubId.name : "";
    const roleName = app.driveId ? app.driveId.roleTitle : "";
    const html = replacePlaceholders(htmlBody, {
      applicantName,
      roleName,
      clubName,
      customMessage: req.body.customMessage || "",
    });
    let emailStatus = "sent";
    try {
      await sendEmail({ to: applicantEmail, subject, html });
    } catch (err) {
      emailStatus = "failed";
    }
    const emailLog = await EmailLog.create({
      applicationId: app._id,
      clubId: app.clubId._id || app.clubId,
      sentBy: req.user._id,
      recipientEmail: applicantEmail,
      recipientName: applicantName,
      subject,
      body: html,
      templateUsed: templateUsed || "custom",
      status: emailStatus,
    });
    return res.status(200).json({
      success: true,
      data: { emailLogId: emailLog._id },
      message: emailStatus === "sent" ? "Email sent" : "Email log saved but send failed",
    });
  } catch (err) {
    next(err);
  }
}

export async function bulkStatusUpdate(req, res, next) {
  try {
    const { applicationIds, status, note } = req.body || {};
    if (!Array.isArray(applicationIds) || applicationIds.length === 0 || !status) {
      return res.status(400).json({ success: false, message: "applicationIds array and status required", data: null });
    }
    if (!APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status", data: null });
    }
    const apps = await Application.find({ _id: { $in: applicationIds } })
      .populate("driveId", "clubId");
    if (apps.length !== applicationIds.length) {
      return res.status(400).json({ success: false, message: "Some application IDs not found", data: null });
    }
    const clubIds = [...new Set(apps.map((a) => (a.clubId || (a.driveId && a.driveId.clubId) || a.driveId).toString()))];
    if (clubIds.length > 1) {
      return res.status(400).json({ success: false, message: "All applications must belong to the same club", data: null });
    }
    const clubId = clubIds[0];
    const clubMember = await ClubMember.findOne({
      clubId: new mongoose.Types.ObjectId(clubId),
      userId: req.user._id,
      status: "active",
    });
    if (!clubMember || clubMember.roleRank > 4) {
      return res.status(403).json({ success: false, message: "Club member access required", data: null });
    }
    let updated = 0;
    for (const app of apps) {
      const appClubId = (app.clubId || app.driveId?.clubId || app.driveId).toString();
      if (appClubId !== clubId) continue;
      const fromStatus = app.status;
      const allowed = VALID_TRANSITIONS[fromStatus] || [];
      if (!allowed.includes(status)) continue;
      app.status = status;
      app.reviewedBy = req.user._id;
      app.statusHistory = app.statusHistory || [];
      app.statusHistory.push({
        fromStatus,
        toStatus: status,
        changedBy: req.user._id,
        changedAt: new Date(),
        note: note || undefined,
      });
      await app.save();
      updated++;
    }
    return res.status(200).json({
      success: true,
      data: { updated },
      message: `${updated} application(s) updated`,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateApplicationRating(req, res, next) {
  try {
    const { rating, reviewNotes } = req.body || {};
    const app = await Application.findById(req.params.applicationId);
    if (!app) return res.status(404).json({ success: false, message: "Application not found", data: null });
    const clubMember = await ClubMember.findOne({
      clubId: app.clubId,
      userId: req.user._id,
      status: "active",
    });
    if (!clubMember || clubMember.roleRank > 4) {
      return res.status(403).json({ success: false, message: "Club member access required", data: null });
    }
    if (rating != null) {
      const r = parseInt(rating, 10);
      if (r < 1 || r > 5) {
        return res.status(400).json({ success: false, message: "rating must be 1-5", data: null });
      }
      app.rating = r;
    }
    if (reviewNotes !== undefined) app.reviewNotes = reviewNotes;
    await app.save();
    const populated = await Application.findById(app._id)
      .populate("applicantId", "name email avatar studentId")
      .populate("driveId", "title roleTitle")
      .populate("clubId", "name logoUrl")
      .lean();
    return res.status(200).json({
      success: true,
      data: populated,
      message: "Rating updated successfully",
    });
  } catch (err) {
    next(err);
  }
}
