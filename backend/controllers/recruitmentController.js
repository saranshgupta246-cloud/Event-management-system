import mongoose from "mongoose";
import RecruitmentDrive from "../models/RecruitmentDrive.js";
import Application from "../models/Application.js";
import Club from "../models/Club.js";
import ClubMember from "../models/ClubMember.js";
import { createUserNotifications } from "../utils/notifications.js";
import { resolveClubObjectId } from "../utils/resolveClubParam.js";

const QUESTION_TYPES = ["text", "textarea", "mcq", "checkbox", "url"];
const DRIVE_STATUSES = ["draft", "open", "paused", "closed"];

function daysLeft(deadline) {
  if (!deadline) return null;
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((d - today) / (24 * 60 * 60 * 1000)));
}

function validateCustomQuestions(questions) {
  if (!Array.isArray(questions)) return "customQuestions must be an array";
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q || typeof q !== "object") return `Question ${i + 1}: invalid`;
    if (!q.label || typeof q.label !== "string" || !q.label.trim()) return `Question ${i + 1}: label required`;
    if (!q.type || !QUESTION_TYPES.includes(q.type)) return `Question ${i + 1}: type must be one of ${QUESTION_TYPES.join(", ")}`;
    if ((q.type === "mcq" || q.type === "checkbox") && (!Array.isArray(q.options) || q.options.length === 0)) {
      return `Question ${i + 1}: options array required for mcq/checkbox`;
    }
  }
  return null;
}

export async function createDrive(req, res, next) {
  try {
    const { clubId } = req.params;
    const resolvedId = await resolveClubObjectId(clubId);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Club not found", data: null });
    }
    const { title, roleTitle, description, requiredSkills, customQuestions, deadline, maxApplicants } = req.body;
    if (!title || !roleTitle || !description || !deadline) {
      return res.status(400).json({
        success: false,
        message: "title, roleTitle, description, and deadline are required",
        data: null,
      });
    }
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "deadline must be a future date",
        data: null,
      });
    }
    const qError = validateCustomQuestions(customQuestions || []);
    if (qError) {
      return res.status(400).json({ success: false, message: qError, data: null });
    }
    const drive = await RecruitmentDrive.create({
      clubId: resolvedId,
      title: title.trim(),
      roleTitle: roleTitle.trim(),
      description: description.trim(),
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      customQuestions: customQuestions || [],
      deadline: deadlineDate,
      maxApplicants: maxApplicants != null ? (parseInt(maxApplicants, 10) || null) : null,
      status: "draft",
      createdBy: req.user._id,
    });
    const populated = await RecruitmentDrive.findById(drive._id)
      .populate("clubId", "name logoUrl category")
      .lean();
    return res.status(201).json({
      success: true,
      data: populated,
      message: "Drive created successfully",
    });
  } catch (err) {
    console.error("[RecruitmentController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function listDrivesByClub(req, res, next) {
  try {
    const { clubId } = req.params;
    const resolvedId = await resolveClubObjectId(clubId);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Club not found", data: null });
    }
    const { status = "open", search } = req.query;
    const filter = { clubId: resolvedId };
    if (status && status !== "all") filter.status = status;
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: new RegExp(escaped, "i") },
        { roleTitle: new RegExp(escaped, "i") },
      ];
    }
    const drives = await RecruitmentDrive.find(filter).lean();
    const withMeta = await Promise.all(
      drives.map(async (d) => {
        const [applicantCount, shortlistedCount, selectedCount] = await Promise.all([
          Application.countDocuments({ driveId: d._id }),
          Application.countDocuments({ driveId: d._id, status: "shortlisted" }),
          Application.countDocuments({ driveId: d._id, status: "selected" }),
        ]);
        return {
          ...d,
          daysLeft: daysLeft(d.deadline),
          applicantCount,
          shortlistedCount,
          selectedCount,
        };
      })
    );
    return res.status(200).json({
      success: true,
      data: withMeta,
      message: "Drives fetched successfully",
    });
  } catch (err) {
    console.error("[RecruitmentController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function listGlobalDrives(req, res, next) {
  try {
    const { category, skills, search, status = "open", page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const filter = { status };
    if (category) {
      const clubs = await Club.find({ category }).select("_id").lean();
      const clubIds = clubs.map((c) => c._id);
      if (clubIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "Drives fetched successfully",
          pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
        });
      }
      filter.clubId = { $in: clubIds };
    }
    if (skills) {
      const skillArr = Array.isArray(skills) ? skills : skills.split(",").map((s) => s.trim()).filter(Boolean);
      if (skillArr.length > 0) {
        filter.requiredSkills = { $in: skillArr };
      }
    }
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: new RegExp(escaped, "i") },
        { roleTitle: new RegExp(escaped, "i") },
      ];
    }
    const [drives, total] = await Promise.all([
      RecruitmentDrive.find(filter)
        .populate("clubId", "name logoUrl category")
        .sort({ deadline: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      RecruitmentDrive.countDocuments(filter),
    ]);
    const withMeta = await Promise.all(
      drives.map(async (d) => {
        const applicantCount = await Application.countDocuments({ driveId: d._id });
        const dl = daysLeft(d.deadline);
        return {
          ...d,
          daysLeft: dl,
          applicantCount,
          isUrgent: dl !== null && dl <= 3,
        };
      })
    );
    const pages = Math.ceil(total / limitNum) || 1;
    return res.status(200).json({
      success: true,
      data: withMeta,
      message: "Drives fetched successfully",
      pagination: { page: pageNum, limit: limitNum, total, pages },
    });
  } catch (err) {
    console.error("[RecruitmentController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getDriveById(req, res, next) {
  try {
    const { clubId, driveId } = req.params;
    const resolvedId = await resolveClubObjectId(clubId);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Club not found", data: null });
    }
    const drive = await RecruitmentDrive.findOne({
      _id: new mongoose.Types.ObjectId(driveId),
      clubId: resolvedId,
    })
      .populate("clubId", "name logoUrl category description")
      .lean();
    if (!drive) {
      return res.status(404).json({ success: false, message: "Drive not found", data: null });
    }
    const applicantCount = await Application.countDocuments({ driveId: drive._id });
    let hasApplied = false;
    if (req.user && req.user._id) {
      const existing = await Application.findOne({
        driveId: drive._id,
        applicantId: req.user._id,
      });
      hasApplied = !!existing;
    }
    return res.status(200).json({
      success: true,
      data: {
        ...drive,
        applicantCount,
        hasApplied,
      },
      message: "Drive fetched successfully",
    });
  } catch (err) {
    console.error("[RecruitmentController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function updateDrive(req, res, next) {
  try {
    const { clubId, driveId } = req.params;
    const resolvedId = await resolveClubObjectId(clubId);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Club not found", data: null });
    }
    const drive = await RecruitmentDrive.findOne({
      _id: new mongoose.Types.ObjectId(driveId),
      clubId: resolvedId,
    });
    if (!drive) {
      return res.status(404).json({ success: false, message: "Drive not found", data: null });
    }
    const allowed = [
      "title",
      "roleTitle",
      "description",
      "requiredSkills",
      "customQuestions",
      "deadline",
      "maxApplicants",
      "status",
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "status") {
          if (!DRIVE_STATUSES.includes(req.body[key])) continue;
          if (req.body[key] === "open" && new Date(drive.deadline) <= new Date()) {
            return res.status(400).json({
              success: false,
              message: "Cannot set status to open when deadline has passed",
              data: null,
            });
          }
          if (req.body[key] === "closed") {
            await Application.updateMany(
              { driveId: drive._id, status: "pending" },
              { $set: { status: "rejected" } }
            );
          }
        }
        if (key === "customQuestions") {
          const submissionCount = await Application.countDocuments({ driveId: drive._id });
          if (submissionCount > 0) {
            return res.status(400).json({
              success: false,
              message: "This drive already has submissions. Questions cannot be edited.",
              data: null,
            });
          }
          const qError = validateCustomQuestions(req.body[key] || []);
          if (qError) {
            return res.status(400).json({ success: false, message: qError, data: null });
          }
        }
        if (key === "deadline") {
          const d = new Date(req.body[key]);
          if (isNaN(d.getTime())) continue;
          drive.deadline = d;
          continue;
        }
        drive[key] = req.body[key];
      }
    }
    await drive.save();
    if (drive.status === "open") {
      const members = await ClubMember.find({ clubId: drive.clubId, status: "active" })
        .select("userId")
        .lean();
      if (members.length > 0) {
        const club = await Club.findById(drive.clubId).select("name").lean();
        const clubName = club?.name || "Club";
        await createUserNotifications(
          members.map((m) => m.userId),
          {
            type: "new_drive",
            title: `New recruitment drive — ${drive.roleTitle} at ${clubName}`,
            message: `Applications are open for ${drive.roleTitle}. Apply before the deadline.`,
            link: "/student/recruitment",
          }
        );
      }
    }
    const populated = await RecruitmentDrive.findById(drive._id)
      .populate("clubId", "name logoUrl category")
      .lean();
    return res.status(200).json({
      success: true,
      data: populated,
      message: "Drive updated successfully",
    });
  } catch (err) {
    console.error("[RecruitmentController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function deleteDrive(req, res, next) {
  try {
    const { clubId, driveId } = req.params;
    const resolvedId = await resolveClubObjectId(clubId);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Club not found", data: null });
    }
    const drive = await RecruitmentDrive.findOne({
      _id: new mongoose.Types.ObjectId(driveId),
      clubId: resolvedId,
    });
    if (!drive) {
      return res.status(404).json({ success: false, message: "Drive not found", data: null });
    }
    if (drive.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Can only delete drives with status draft",
        data: null,
      });
    }
    await Application.deleteMany({ driveId: drive._id });
    await RecruitmentDrive.findByIdAndDelete(drive._id);
    return res.status(200).json({
      success: true,
      data: null,
      message: "Drive deleted successfully",
    });
  } catch (err) {
    console.error("[RecruitmentController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
