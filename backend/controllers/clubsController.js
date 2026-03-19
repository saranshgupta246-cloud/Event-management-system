import mongoose from "mongoose";
import Club from "../models/Club.js";
import ClubMember from "../models/ClubMember.js";
import RoleChangeLog from "../models/RoleChangeLog.js";
import User from "../models/User.js";
import RecruitmentDrive from "../models/RecruitmentDrive.js";
import { createUserNotification } from "../utils/notifications.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { appCache } from "../middleware/cache.middleware.js";

const ROLE_RANK_MAP = {
  President: 1,
  Secretary: 2,
  Treasurer: 3,
  "Core Member": 4,
  Volunteer: 5,
  Member: 6,
};

// Canonical set of club categories. Keep in sync with frontend.
const CLUB_CATEGORIES = [
  "Technical",
  "Cultural",
  "Sports",
  "Innovation",
  "Literary",
  "Workshops",
  "Social",
  "Research",
];
const MEMBER_ROLES = ["President", "Secretary", "Treasurer", "Core Member", "Volunteer", "Member"];

function getRoleRank(role) {
  return ROLE_RANK_MAP[role] ?? 6;
}

export async function createClub(req, res, next) {
  try {
    const { name, description, category, logoUrl, bannerUrl } = req.body;
    const club = await Club.create({
      name: name?.trim(),
      description: description || undefined,
      category,
      logoUrl: logoUrl || undefined,
      bannerUrl: bannerUrl || undefined,
      createdBy: req.user._id,
    });
    // Invalidate cached club listings
    appCache.del("/api/clubs");

    return res.status(201).json({
      success: true,
      data: club,
      message: "Club created successfully",
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.name) {
      return res.status(400).json({
        success: false,
        message: "Club name already exists",
        data: null,
      });
    }
    console.error("[ClubsController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function listClubs(req, res, next) {
  try {
    const { category, search, status } = req.query;
    const filter = {};
    if (category) {
      // Match category case-insensitively so 'Technical' and 'technical' both work
      const escaped = category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.category = new RegExp(`^${escaped}$`, "i");
    }
    if (status) filter.status = status;
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = new RegExp(escaped, "i");
    }
    const clubs = await Club.find(filter).populate("createdBy", "name avatar").lean();
    const withCounts = await Promise.all(
      clubs.map(async (c) => {
        const [memberCount, openDrivesCount] = await Promise.all([
          ClubMember.countDocuments({
            clubId: c._id,
            status: "active",
          }),
          RecruitmentDrive.countDocuments({
            clubId: c._id,
            status: "open",
          }),
        ]);
        return {
          _id: c._id,
          name: c.name,
          description: c.description,
          category: c.category,
          logoUrl: c.logoUrl,
          status: c.status,
          createdBy: c.createdBy,
          createdAt: c.createdAt,
          memberCount,
          openDrivesCount,
        };
      })
    );
    return res.status(200).json({
      success: true,
      data: withCounts,
      message: "Clubs fetched successfully",
    });
  } catch (err) {
    console.error("[ClubsController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function checkNameAvailability(req, res, next) {
  try {
    const name = (req.query.name || "").trim();
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
        data: { available: false },
      });
    }
    const exists = await Club.findOne({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") });
    return res.status(200).json({
      success: true,
      data: { available: !exists },
      message: exists ? "Name already taken" : "Name available",
    });
  } catch (err) {
    console.error("[ClubsController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getClubById(req, res, next) {
  try {
    const { clubId } = req.params;
    const club = await Club.findById(clubId).lean();
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
        data: null,
      });
    }
    const [coreTeam, totalMembers] = await Promise.all([
      ClubMember.find({
        clubId: new mongoose.Types.ObjectId(clubId),
        roleRank: { $lte: 3 },
        status: "active",
      })
        .populate("userId", "name email avatar")
        .lean(),
      ClubMember.countDocuments({ clubId: new mongoose.Types.ObjectId(clubId), status: "active" }),
    ]);
    return res.status(200).json({
      success: true,
      data: {
        ...club,
        coreTeam,
        totalMembers,
      },
      message: "Club fetched successfully",
    });
  } catch (err) {
    console.error("[ClubsController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function updateClub(req, res, next) {
  try {
    const { clubId } = req.params;
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
        data: null,
      });
    }
    const allowed = ["name", "description", "category", "logoUrl", "bannerUrl", "status"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "status" && !["active", "inactive"].includes(req.body[key])) continue;
        if (key === "name" && typeof req.body[key] === "string") updates[key] = req.body[key].trim();
        else updates[key] = req.body[key];
      }
    }
    Object.assign(club, updates);
    await club.save();

    // Invalidate cached club listings
    appCache.del("/api/clubs");

    return res.status(200).json({
      success: true,
      data: club,
      message: "Club updated successfully",
    });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.name) {
      return res.status(400).json({
        success: false,
        message: "Club name already exists",
        data: null,
      });
    }
    console.error("[ClubsController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function deleteClub(req, res, next) {
  try {
    const { clubId } = req.params;
    const club = await Club.findByIdAndUpdate(
      clubId,
      { status: "inactive" },
      { new: true }
    );
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
        data: null,
      });
    }

    // Invalidate cached club listings
    appCache.del("/api/clubs");

    return res.status(200).json({
      success: true,
      data: null,
      message: "Club deactivated successfully",
    });
  } catch (err) {
    console.error("[ClubsController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function addMember(req, res, next) {
  try {
    const { clubId } = req.params;
    const { userId, role } = req.body;
    const assignRank = getRoleRank(role);
    if (req.clubMember && req.clubMember.roleRank >= assignRank) {
      return res.status(403).json({
        success: false,
        message: "You cannot assign a role equal or higher than your own",
        data: null,
      });
    }
    const existing = await ClubMember.findOne({
      clubId: new mongoose.Types.ObjectId(clubId),
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.status === "active" ? "User is already a member" : "Member record exists",
        data: null,
      });
    }
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }
    const member = await ClubMember.create({
      clubId: new mongoose.Types.ObjectId(clubId),
      userId: new mongoose.Types.ObjectId(userId),
      role,
      addedBy: req.user._id,
    });
    await RoleChangeLog.create({
      clubId: new mongoose.Types.ObjectId(clubId),
      targetUserId: new mongoose.Types.ObjectId(userId),
      changedBy: req.user._id,
      fromRole: null,
      toRole: role,
      fromRank: null,
      toRank: assignRank,
      reason: null,
    });
    await createAuditLog({
      action: "MEMBER_ADDED",
      performedBy: req.user._id,
      targetUser: userId,
      targetId: clubId,
      targetModel: "Club",
      details: { role },
      req,
    });
    const populated = await ClubMember.findById(member._id)
      .populate("userId", "name email avatar studentId")
      .populate("addedBy", "name email")
      .lean();
    const data = populated ? { ...populated, enrollmentId: populated.userId?.studentId } : populated;
    return res.status(201).json({
      success: true,
      data,
      message: "Member added successfully",
    });
  } catch (err) {
    console.error("[ClubsController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function listMembers(req, res, next) {
  try {
    const { clubId } = req.params;
    const { role, status, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const filter = { clubId: new mongoose.Types.ObjectId(clubId) };
    if (role) filter.role = role;
    if (status) filter.status = status;

    let userIds = null;
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const users = await User.find({
        name: new RegExp(escaped, "i"),
      })
        .select("_id")
        .lean();
      userIds = users.map((u) => u._id);
      if (userIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          message: "Members fetched successfully",
          pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
        });
      }
      filter.userId = { $in: userIds };
    }

    const [members, total] = await Promise.all([
      ClubMember.find(filter)
        .populate("userId", "name email avatar studentId")
        .sort({ roleRank: 1, joinedAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      ClubMember.countDocuments(filter),
    ]);

    const data = members.map((m) => ({
      ...m,
      enrollmentId: m.userId?.studentId,
    }));

    const pages = Math.ceil(total / limitNum) || 1;
    return res.status(200).json({
      success: true,
      data,
      message: "Members fetched successfully",
      pagination: { page: pageNum, limit: limitNum, total, pages },
    });
  } catch (err) {
    console.error("[ClubsController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function updateMemberRole(req, res, next) {
  try {
    const { clubId, memberId } = req.params;
    const { role, reason } = req.body;
    const member = await ClubMember.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      clubId: new mongoose.Types.ObjectId(clubId),
    });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
        data: null,
      });
    }
    const newRank = getRoleRank(role);
    if (req.clubMember.roleRank >= member.roleRank) {
      return res.status(403).json({
        success: false,
        message: "You cannot change the role of a member with same or higher rank",
        data: null,
      });
    }
    if (req.clubMember.roleRank >= newRank) {
      return res.status(403).json({
        success: false,
        message: "You cannot assign a role equal or higher than your own",
        data: null,
      });
    }
    const fromRole = member.role;
    const fromRank = member.roleRank;
    member.role = role;
    await member.save();
    await createAuditLog({
      action: "MEMBER_ROLE_CHANGED",
      performedBy: req.user._id,
      targetUser: member.userId,
      targetId: clubId,
      targetModel: "Club",
      details: { fromRole, toRole: role },
      req,
    });
    await RoleChangeLog.create({
      clubId: new mongoose.Types.ObjectId(clubId),
      targetUserId: member.userId,
      changedBy: req.user._id,
      fromRole,
      toRole: role,
      fromRank,
      toRank: newRank,
      reason: reason || undefined,
    });
    await createUserNotification({
      userId: member.userId,
      type: "role_change",
      title: `Role updated to ${role}`,
      message: `Your role in the club has been changed from ${fromRole} to ${role}.`,
      link: `/leader/clubs/${clubId}/team`,
    });
    const populated = await ClubMember.findById(member._id)
      .populate("userId", "name email avatar studentId")
      .lean();
    const data = populated ? { ...populated, enrollmentId: populated.userId?.studentId } : populated;
    return res.status(200).json({
      success: true,
      data,
      message: "Member role updated successfully",
    });
  } catch (err) {
    console.error("[ClubsController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function removeMember(req, res, next) {
  try {
    const { clubId, memberId } = req.params;
    const member = await ClubMember.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      clubId: new mongoose.Types.ObjectId(clubId),
    });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
        data: null,
      });
    }
    if (req.clubMember.roleRank >= member.roleRank) {
      return res.status(403).json({
        success: false,
        message: "You cannot remove a member with same or higher rank",
        data: null,
      });
    }
    member.status = "inactive";
    await member.save();
    await createAuditLog({
      action: "MEMBER_REMOVED",
      performedBy: req.user._id,
      targetUser: member.userId,
      targetId: clubId,
      targetModel: "Club",
      details: {},
      req,
    });
    return res.status(200).json({
      success: true,
      data: null,
      message: "Member removed successfully",
    });
  } catch (err) {
    console.error("[ClubsController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getMemberRoleHistory(req, res, next) {
  try {
    const { clubId, memberId } = req.params;
    const member = await ClubMember.findOne({
      _id: new mongoose.Types.ObjectId(memberId),
      clubId: new mongoose.Types.ObjectId(clubId),
    }).select("userId");
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
        data: null,
      });
    }
    const logs = await RoleChangeLog.find({
      clubId: new mongoose.Types.ObjectId(clubId),
      targetUserId: member.userId,
    })
      .populate("changedBy", "name email avatar")
      .sort({ changedAt: -1 })
      .lean();
    return res.status(200).json({
      success: true,
      data: logs,
      message: "Role history fetched successfully",
    });
  } catch (err) {
    console.error("[ClubsController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function searchUsersForClub(req, res, next) {
  try {
    const { clubId } = req.params;
    const q = (req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "Provide at least 2 characters to search",
      });
    }
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({
      $or: [
        { name: regex },
        { email: regex },
        ...(req.query.byId === "true" || /^[a-zA-Z0-9-]+$/.test(q) ? [{ studentId: regex }] : []),
      ],
      isActive: true,
    })
      .select("name email avatar studentId")
      .limit(20)
      .lean();

    const userIds = users.map((u) => u._id);
    const existing = await ClubMember.find({
      clubId: new mongoose.Types.ObjectId(clubId),
      userId: { $in: userIds },
      status: "active",
    })
      .select("userId")
      .lean();
    const existingSet = new Set(existing.map((e) => e.userId.toString()));

    const data = users.map((u) => ({
      ...u,
      enrollmentId: u.studentId,
      isAlreadyMember: existingSet.has(u._id.toString()),
    }));

    return res.status(200).json({
      success: true,
      data,
      message: "Users fetched successfully",
    });
  } catch (err) {
    console.error("[ClubsController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export { ROLE_RANK_MAP, CLUB_CATEGORIES, MEMBER_ROLES };
