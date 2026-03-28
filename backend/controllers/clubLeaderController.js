import mongoose from "mongoose";
import Club from "../models/Club.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";

const RANK_BY_CLUB_ROLE = {
  President: 1,
  Secretary: 2,
  Treasurer: 3,
  "Core Member": 4,
  Volunteer: 5,
  Member: 6,
};

async function getLeaderClub(req) {
  const clubId = req.user?.clubId;
  if (!clubId) return null;
  const club = await Club.findById(clubId);
  return club;
}

export async function getMyClubMembers(req, res) {
  try {
    const club = await getLeaderClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a club leader" });
    }
    const { clubRole, search, page = 1, limit = 50, status } = req.query;
    const filter = { clubId: club._id };
    if (status === "active" || !status) filter.status = "approved";
    else if (status === "inactive") filter.status = "inactive";
    else if (status === "all") filter.status = { $in: ["approved", "inactive"] };
    if (clubRole) filter.clubRole = clubRole;

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");
      const matchingUsers = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { studentId: searchRegex }
        ]
      }).select("_id").lean();
      filter.userId = { $in: matchingUsers.map(u => u._id) };
    }

    let query = Membership.find(filter).populate("userId", "name email avatar studentId phone");

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, Math.max(1, parseInt(limit, 10)));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const total = await Membership.countDocuments(query.getFilter());
    const list = await query.sort({ roleRank: 1, joinedAt: -1 }).skip(skip).limit(take).lean();

    const coreTeam = list.filter((m) => m.roleRank <= 3);
    const others = list.filter((m) => m.roleRank > 3);

    return res.status(200).json({
      success: true,
      data: { coreTeam, others },
      pagination: { page: parseInt(page, 10), limit: take, total },
    });
  } catch (err) {
    console.error("[ClubLeaderController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function updateMemberClubRole(req, res) {
  try {
    const club = await getLeaderClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a club leader" });
    }
    const { memberId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    const { clubRole, reason } = req.body;
    if (!clubRole || !RANK_BY_CLUB_ROLE[clubRole]) {
      return res.status(400).json({ success: false, message: "Invalid clubRole" });
    }

    const membership = await Membership.findOne({ _id: memberId, clubId: club._id }).populate("userId", "name email");
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }

    const leaderMembership = await Membership.findOne({ userId: req.user._id, clubId: club._id });
    const leaderRank = req.user.role === "leader"
      ? 1
      : (leaderMembership?.roleRank ?? 6);
    const newRank = RANK_BY_CLUB_ROLE[clubRole];
    if (leaderRank >= newRank) {
      return res.status(403).json({ success: false, message: "You can only assign roles below your own rank" });
    }

    if (membership.roleRank === 1 && req.user.role !== "club_leader") {
      return res.status(403).json({
        success: false,
        message: "Only the club leader can change the President role",
      });
    }

    const oldRole = membership.clubRole;
    membership.roleHistory.push({
      fromRole: oldRole,
      toRole: clubRole,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: reason || undefined,
    });
    membership.clubRole = clubRole;
    membership.roleRank = newRank;
    await membership.save();

    const updated = await Membership.findById(membership._id)
      .populate("userId", "name email avatar studentId phone")
      .lean();
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error("[ClubLeaderController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function addMemberToClub(req, res) {
  try {
    const club = await getLeaderClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a club leader" });
    }
    const { userId, clubRole } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required" });
    }
    const role = clubRole && RANK_BY_CLUB_ROLE[clubRole] ? clubRole : "Member";

    const user = await User.findById(userId).select("name email");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const existing = await Membership.findOne({ userId, clubId: club._id });
    if (existing && existing.status === "approved") {
      return res.status(400).json({ success: false, message: "User is already an approved member" });
    }
    if (existing && existing.status === "pending") {
      existing.status = "approved";
      existing.clubRole = role;
      existing.roleRank = RANK_BY_CLUB_ROLE[role];
      await existing.save();
      const created = await Membership.findById(existing._id)
        .populate("userId", "name email avatar studentId phone")
        .lean();
      return res.status(200).json({ success: true, data: created });
    }

    const membership = await Membership.create({
      userId,
      clubId: club._id,
      clubRole: role,
      roleRank: RANK_BY_CLUB_ROLE[role],
      status: "approved",
    });
    const created = await Membership.findById(membership._id)
      .populate("userId", "name email avatar studentId phone")
      .lean();
    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error("[ClubLeaderController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function removeMember(req, res) {
  try {
    const club = await getLeaderClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a club leader" });
    }
    const { memberId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const membership = await Membership.findOne({ _id: memberId, clubId: club._id });
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }

    if (membership.userId.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You cannot remove yourself" });
    }

    const callerRole = req.user?.role;
    const isAdmin = callerRole === "admin";
    const isFaculty =
      callerRole === "faculty_coordinator" &&
      req.user.clubIds?.map((id) => id.toString()).includes(String(club._id));

    if (isAdmin || isFaculty) {
      membership.status = "inactive";
      await membership.save();
      return res.status(200).json({ success: true, message: "Member removed" });
    }

    const callerMembership = await Membership.findOne({
      userId: req.user._id,
      clubId: club._id,
      status: "approved",
    });
    if (!callerMembership) {
      return res.status(403).json({ success: false, message: "Not a member of this club" });
    }

    const cr = callerMembership.roleRank;
    if (cr > 3) {
      return res.status(403).json({ success: false, message: "Insufficient role to remove members" });
    }

    if (membership.roleRank <= 3) {
      return res.status(403).json({
        success: false,
        message: "Core officers can only be removed by faculty or admin",
      });
    }

    membership.status = "inactive";
    await membership.save();
    return res.status(200).json({ success: true, message: "Member removed" });
  } catch (err) {
    console.error("[ClubLeaderController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function reactivateMember(req, res) {
  try {
    const club = await getLeaderClub(req);
    if (!club) return res.status(403).json({
      success: false,
      message: "You are not a club leader",
    });
    const { memberId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    const membership = await Membership.findOne({
      _id: memberId,
      clubId: club._id,
    });
    if (!membership) return res.status(404).json({
      success: false,
      message: "Membership not found",
    });
    membership.status = "approved";
    await membership.save();
    return res.status(200).json({
      success: true,
      message: "Member reactivated",
    });
  } catch (err) {
    console.error("[ClubLeaderController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getMemberRoleHistory(req, res) {
  try {
    const club = await getLeaderClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a club leader" });
    }
    const { memberId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const membership = await Membership.findOne({ _id: memberId, clubId: club._id });
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }
    const roleHistory = (membership.roleHistory || []).map((e) => ({
      fromRole: e.fromRole,
      toRole: e.toRole,
      changedAt: e.changedAt,
      reason: e.reason,
      changedBy: e.changedBy,
    }));
    const changedByIds = [...new Set(roleHistory.map((e) => e.changedBy).filter(Boolean))];
    const users = await User.find({ _id: { $in: changedByIds } }).select("name avatar").lean();
    const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));
    const populated = roleHistory.map((e) => ({
      ...e,
      changedBy: e.changedBy ? userMap[String(e.changedBy)] : null,
    }));
    return res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error("[ClubLeaderController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function searchUsersForLeaderClub(req, res) {
  try {
    const club = await getLeaderClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a club leader" });
    }
    const q = (req.query.q || "").trim();
    if (q.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escaped, "i");
    const members = await Membership.find({ clubId: club._id, status: "approved" }).select("userId").lean();
    const memberIds = members.map((m) => m.userId);
    const users = await User.find({
      _id: { $nin: memberIds },
      $or: [{ name: searchRegex }, { email: searchRegex }, { studentId: searchRegex }],
    })
      .select("name email avatar studentId")
      .limit(20)
      .lean();
    const pending = await Membership.find({ clubId: club._id, status: "pending" }).select("userId").lean();
    const pendingIds = new Set(pending.map((p) => String(p.userId)));
    const data = users.map((u) => ({
      ...u,
      enrollmentId: u.studentId,
      isAlreadyMember: false,
    }));
    const inClub = await User.find({
      _id: { $in: memberIds },
      $or: [{ name: searchRegex }, { email: searchRegex }, { studentId: searchRegex }],
    })
      .select("name email avatar studentId")
      .limit(10)
      .lean();
    inClub.forEach((u) => {
      data.push({
        ...u,
        enrollmentId: u.studentId,
        isAlreadyMember: true,
      });
    });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[ClubLeaderController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
