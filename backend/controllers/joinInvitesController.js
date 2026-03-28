import mongoose from "mongoose";
import JoinInvite from "../models/JoinInvite.js";
import ClubMember from "../models/ClubMember.js";
import User from "../models/User.js";
import { generateJoinInviteToken } from "../utils/joinInviteToken.js";
import { resolveClubObjectId } from "../utils/resolveClubParam.js";

/**
 * Internal helper to create a join invite document.
 */
export async function createJoinInvite({
  clubId,
  email,
  applicationId,
  applicantId,
  role = "Member",
  createdBy,
  source = "recruitment_selection",
  ttlMinutes = 60 * 24 * 7, // default 7 days
}) {
  if (!clubId || !email) {
    throw new Error("clubId and email are required to create an invite");
  }
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  const token = generateJoinInviteToken(32);

  const doc = await JoinInvite.create({
    clubId: new mongoose.Types.ObjectId(clubId),
    email: String(email).trim().toLowerCase(),
    applicationId: applicationId ? new mongoose.Types.ObjectId(applicationId) : undefined,
    applicantId: applicantId ? new mongoose.Types.ObjectId(applicantId) : undefined,
    token,
    role,
    expiresAt,
    createdBy: createdBy ? new mongoose.Types.ObjectId(createdBy) : undefined,
    source,
  });

  return doc;
}

export async function markInviteUsed({ inviteId, usedBy }) {
  if (!inviteId) throw new Error("inviteId is required");
  const invite = await JoinInvite.findById(inviteId);
  if (!invite) throw new Error("Invite not found");
  invite.status = "used";
  invite.usedAt = new Date();
  if (usedBy) {
    invite.usedBy = new mongoose.Types.ObjectId(usedBy);
  }
  await invite.save();
  return invite;
}

export async function revokeInviteById(inviteId) {
  if (!inviteId) throw new Error("inviteId is required");
  const invite = await JoinInvite.findById(inviteId);
  if (!invite) return null;
  invite.status = "revoked";
  await invite.save();
  return invite;
}

export async function findActiveInviteByToken(token) {
  if (!token) return null;
  const now = new Date();
  const invite = await JoinInvite.findOne({
    token,
    status: "pending",
    expiresAt: { $gt: now },
  });
  return invite;
}

// HTTP handlers

export async function createLeaderInvite(req, res) {
  try {
    const { clubId } = req.params;
    const resolvedId = await resolveClubObjectId(clubId);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Club not found", data: null });
    }
    const { email, role = "Member", userId } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: "email is required", data: null });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    let user = null;
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, message: "Invalid userId", data: null });
      }
      user = await User.findById(userId).lean();
    } else {
      user = await User.findOne({ email: normalizedEmail }).lean();
    }

    if (user) {
      const existingMember = await ClubMember.findOne({
        clubId: resolvedId,
        userId: user._id,
        status: "active",
      });
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: "User is already an active member of this club",
          data: null,
        });
      }
    }

    const invite = await createJoinInvite({
      clubId: resolvedId,
      email: normalizedEmail,
      applicationId: undefined,
      applicantId: user ? user._id : undefined,
      role,
      createdBy: req.user._id,
      source: "leader_invite",
    });

    return res.status(201).json({
      success: true,
      data: invite,
      message: "Invite created successfully",
    });
  } catch (err) {
    console.error("[JoinInvitesController] createLeaderInvite", err);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function listInvitesForClub(req, res) {
  try {
    const { clubId } = req.params;
    const resolvedId = await resolveClubObjectId(clubId);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Club not found", data: null });
    }
    const { status = "pending" } = req.query;
    const filter = {
      clubId: resolvedId,
    };
    if (status && status !== "all") {
      filter.status = status;
    }
    const invites = await JoinInvite.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({
      success: true,
      data: invites,
      message: "Invites fetched successfully",
    });
  } catch (err) {
    console.error("[JoinInvitesController] listInvitesForClub", err);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function revokeInvite(req, res) {
  try {
    const { clubId, inviteId } = req.params;
    const resolvedId = await resolveClubObjectId(clubId);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Club not found", data: null });
    }
    if (!mongoose.Types.ObjectId.isValid(inviteId)) {
      return res.status(400).json({ success: false, message: "Invalid inviteId", data: null });
    }
    const invite = await JoinInvite.findOne({
      _id: new mongoose.Types.ObjectId(inviteId),
      clubId: resolvedId,
    });
    if (!invite) {
      return res.status(404).json({ success: false, message: "Invite not found", data: null });
    }
    invite.status = "revoked";
    await invite.save();
    return res.status(200).json({
      success: true,
      data: null,
      message: "Invite revoked successfully",
    });
  } catch (err) {
    console.error("[JoinInvitesController] revokeInvite", err);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function acceptInvite(req, res) {
  try {
    const { clubId } = req.params;
    const resolvedId = await resolveClubObjectId(clubId);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Club not found", data: null });
    }
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ success: false, message: "token is required", data: null });
    }
    const invite = await findActiveInviteByToken(token);
    if (!invite || invite.clubId.toString() !== resolvedId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired invite",
        data: null,
      });
    }
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authorized", data: null });
    }
    const emailMatches =
      invite.email && user.email && invite.email.toLowerCase() === user.email.toLowerCase();
    const userMatches =
      invite.applicantId &&
      invite.applicantId.toString &&
      invite.applicantId.toString() === user._id.toString();
    if (!emailMatches && !userMatches) {
      return res.status(403).json({
        success: false,
        message: "This invite is not intended for your account",
        data: null,
      });
    }

    let member = await ClubMember.findOne({
      clubId: resolvedId,
      userId: user._id,
    });
    if (member) {
      member.status = "active";
      member.role = invite.role || member.role || "Member";
      await member.save();
    } else {
      member = await ClubMember.create({
        clubId: resolvedId,
        userId: user._id,
        role: invite.role || "Member",
        status: "active",
        joinedAt: new Date(),
        addedBy: invite.createdBy || undefined,
      });
    }

    await markInviteUsed({ inviteId: invite._id, usedBy: user._id });

    const populated = await ClubMember.findById(member._id)
      .populate("userId", "name email avatar studentId department")
      .lean();

    return res.status(200).json({
      success: true,
      data: populated,
      message: "You have joined the club successfully",
    });
  } catch (err) {
    console.error("[JoinInvitesController] acceptInvite", err);
    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}


