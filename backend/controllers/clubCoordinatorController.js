import mongoose from "mongoose";
import Club from "../models/Club.js";
import Membership from "../models/Membership.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Certificate from "../models/Certificate.js";
import { Readable } from "stream";

const RANK_BY_CLUB_ROLE = {
  "Faculty Coordinator": 0,
  President: 1,
  Secretary: 2,
  Treasurer: 3,
  "Core Member": 4,
  Volunteer: 5,
  Member: 6,
};

async function getCoordinatorClub(req) {
  const clubIds = req.user?.clubIds || [];
  const isAdmin = req.user?.role === "admin";

  // Support selecting a specific club via query/params for admin and coordinator paths.
  let clubId = req.query.clubId || req.params?.clubId || clubIds[0];

  if (!clubId && isAdmin) {
    const firstClub = await Club.findOne({}).select("_id").lean();
    clubId = firstClub?._id;
  }

  if (!clubId) return null;

  if (!isAdmin && !clubIds.map((id) => id.toString()).includes(clubId.toString())) {
    return null;
  }
  
  const club = await Club.findById(clubId);
  return club;
}

export async function listCoordinatorEvents(req, res) {
  try {
    const clubIds = Array.isArray(req.user?.clubIds) ? req.user.clubIds : [];
    const isAdmin = req.user?.role === "admin";

    if (!isAdmin && clubIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const match = isAdmin ? {} : { clubId: { $in: clubIds } };

    const events = await Event.find(match)
      .select("_id title eventDate status clubId totalSeats")
      .sort({ eventDate: -1 })
      .limit(200)
      .lean();

    const eventIds = events.map((e) => e._id);

    const [regsAgg, certAgg] = await Promise.all([
      eventIds.length
        ? Registration.aggregate([
            { $match: { event: { $in: eventIds }, status: "confirmed" } },
            { $group: { _id: "$event", confirmedRegistrations: { $sum: 1 } } },
          ])
        : [],
      eventIds.length
        ? Certificate.aggregate([
            { $match: { eventId: { $in: eventIds }, status: "generated" } },
            { $group: { _id: "$eventId", certificatesGenerated: { $sum: 1 } } },
          ])
        : [],
    ]);

    const regsMap = new Map(regsAgg.map((r) => [String(r._id), r.confirmedRegistrations || 0]));
    const certMap = new Map(certAgg.map((c) => [String(c._id), c.certificatesGenerated || 0]));

    const data = events.map((e) => ({
      ...e,
      confirmedRegistrations: regsMap.get(String(e._id)) || 0,
      certificatesGenerated: certMap.get(String(e._id)) || 0,
    }));

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[ClubCoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getMyClubMembers(req, res) {
  try {
    const club = await getCoordinatorClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a faculty coordinator" });
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
    console.error("[ClubCoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function updateMemberClubRole(req, res) {
  try {
    const club = await getCoordinatorClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a faculty coordinator" });
    }
    const { memberId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    const { clubRole, reason } = req.body;
    if (!clubRole || RANK_BY_CLUB_ROLE[clubRole] === undefined) {
      return res.status(400).json({ success: false, message: "Invalid clubRole" });
    }

    const membership = await Membership.findOne({ _id: memberId, clubId: club._id }).populate("userId", "name email");
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }

    const coordinatorMembership = await Membership.findOne({ userId: req.user._id, clubId: club._id });
    const coordinatorRank = req.user.role === "faculty_coordinator"
      ? 0
      : (coordinatorMembership?.roleRank ?? 6);
    const newRank = RANK_BY_CLUB_ROLE[clubRole];
    if (coordinatorRank >= newRank) {
      return res.status(403).json({ success: false, message: "You can only assign roles below your own rank" });
    }

    if (membership.roleRank === 0 && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can change the Faculty Coordinator role",
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
    console.error("[ClubCoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function addMemberToClub(req, res) {
  try {
    const club = await getCoordinatorClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a faculty coordinator" });
    }
    const { userId, email, clubRole } = req.body;
    
    let user;
    if (userId) {
      user = await User.findById(userId).select("name email");
    } else if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() }).select("name email");
    }
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const role = clubRole && RANK_BY_CLUB_ROLE[clubRole] !== undefined ? clubRole : "Member";

    const existing = await Membership.findOne({ userId: user._id, clubId: club._id });
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
      userId: user._id,
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
    console.error("[ClubCoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function removeMember(req, res) {
  try {
    const club = await getCoordinatorClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a faculty coordinator" });
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
    if (membership.roleRank === 0) {
      return res.status(403).json({ success: false, message: "Cannot remove Faculty Coordinator" });
    }

    membership.status = "inactive";
    await membership.save();
    return res.status(200).json({ success: true, message: "Member removed" });
  } catch (err) {
    console.error("[ClubCoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function reactivateMember(req, res) {
  try {
    const club = await getCoordinatorClub(req);
    if (!club) return res.status(403).json({
      success: false,
      message: "You are not a faculty coordinator",
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
    console.error("[ClubCoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getMemberRoleHistory(req, res) {
  try {
    const club = await getCoordinatorClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a faculty coordinator" });
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
    console.error("[ClubCoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function searchUsersForCoordinatorClub(req, res) {
  try {
    const club = await getCoordinatorClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a faculty coordinator" });
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
    console.error("[ClubCoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

// CSV Import for members - only existing users allowed
export async function importMembersFromCSV(req, res) {
  try {
    const club = await getCoordinatorClub(req);
    if (!club) {
      return res.status(403).json({ success: false, message: "You are not a faculty coordinator" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No CSV file provided" });
    }

    const csvContent = req.file.buffer.toString("utf-8");
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ success: false, message: "CSV file is empty or has no data rows" });
    }

    const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
    const emailIdx = headers.indexOf("email");
    const roleIdx = headers.indexOf("role");
    
    if (emailIdx === -1) {
      return res.status(400).json({ success: false, message: "CSV must have 'email' column" });
    }

    const results = {
      added: 0,
      skipped: 0,
      errors: [],
    };

    // Check if club already has a president
    const existingPresident = await Membership.findOne({ 
      clubId: club._id, 
      clubRole: "President", 
      status: "approved" 
    });

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map(cell => cell.trim());
      const email = row[emailIdx]?.toLowerCase();
      const roleName = roleIdx !== -1 ? row[roleIdx] : "Member";

      if (!email) {
        results.errors.push({ row: i + 1, error: "Email is required" });
        results.skipped++;
        continue;
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        results.errors.push({ row: i + 1, email, error: "User not found in system" });
        results.skipped++;
        continue;
      }

      // Validate role
      const normalizedRole = Object.keys(RANK_BY_CLUB_ROLE).find(
        r => r.toLowerCase() === roleName.toLowerCase()
      ) || "Member";

      // Check if already a member
      const existingMember = await Membership.findOne({ userId: user._id, clubId: club._id });
      if (existingMember && existingMember.status === "approved") {
        results.errors.push({ row: i + 1, email, error: "Already a member" });
        results.skipped++;
        continue;
      }

      // Check for duplicate President
      if (normalizedRole === "President" && existingPresident) {
        results.errors.push({ row: i + 1, email, error: "Club already has a President" });
        results.skipped++;
        continue;
      }

      // Faculty Coordinator can only be assigned by Admin
      if (normalizedRole === "Faculty Coordinator") {
        results.errors.push({ row: i + 1, email, error: "Faculty Coordinator can only be assigned by Admin" });
        results.skipped++;
        continue;
      }

      // Create or update membership
      if (existingMember) {
        existingMember.status = "approved";
        existingMember.clubRole = normalizedRole;
        existingMember.roleRank = RANK_BY_CLUB_ROLE[normalizedRole];
        await existingMember.save();
      } else {
        await Membership.create({
          userId: user._id,
          clubId: club._id,
          clubRole: normalizedRole,
          roleRank: RANK_BY_CLUB_ROLE[normalizedRole],
          status: "approved",
        });
      }

      // Track if we just added a president
      if (normalizedRole === "President") {
        // Update our tracking to prevent duplicates in same import
        results.addedPresident = true;
      }

      results.added++;
    }

    return res.status(200).json({
      success: true,
      data: results,
      message: `Import complete: ${results.added} added, ${results.skipped} skipped`,
    });
  } catch (err) {
    console.error("[ClubCoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
