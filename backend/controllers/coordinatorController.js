import mongoose from "mongoose";
import Club from "../models/Club.js";
import Membership from "../models/Membership.js";

export async function getMyClub(req, res) {
  try {
    const isAdmin = req.user.role === "admin";
    const isCoordinator = req.user.role === "faculty_coordinator";

    if (!isAdmin && (!isCoordinator || !req.user.clubIds?.length)) {
      return res.status(403).json({ success: false, message: "You are not authorized for coordinator access" });
    }

    // Admin can pass any clubId (or fallback to first available club).
    // Coordinator is restricted to their assigned clubs.
    let clubId = req.query.clubId;
    if (!clubId) {
      if (req.user.clubIds?.length) {
        clubId = req.user.clubIds[0];
      } else if (isAdmin) {
        const firstClub = await Club.findOne({}).select("_id").lean();
        clubId = firstClub?._id;
      }
    }

    if (!clubId) {
      return res.status(404).json({ success: false, message: "No clubs found" });
    }

    if (!isAdmin && !req.user.clubIds.map((id) => id.toString()).includes(clubId.toString())) {
      return res.status(403).json({ success: false, message: "Access denied to this club" });
    }

    const club = await Club.findById(clubId)
      .populate("coordinator", "name email")
      .lean();
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    if (!isAdmin && club.coordinator?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const memberCount = await Membership.countDocuments({ clubId: club._id, status: "approved" });
    const pendingCount = await Membership.countDocuments({ clubId: club._id, status: "pending" });
    return res.status(200).json({
      success: true,
      data: { ...club, memberCount, pendingCount },
      message: "Club fetched successfully",
    });
  } catch (err) {
    console.error("[CoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function approveMember(req, res) {
  try {
    const { membershipId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    const membership = await Membership.findById(membershipId).populate("clubId");
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }
    const club = await Club.findById(membership.clubId._id || membership.clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    
    const isAdmin = req.user.role === "admin";
    // Coordinators are scoped to assigned clubs; admins can manage any.
    if (!isAdmin && !req.user.clubIds?.map(id => id.toString()).includes(club._id.toString())) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    membership.status = "approved";
    await membership.save();
    await Club.findByIdAndUpdate(club._id, { $addToSet: { members: membership.userId } });
    return res.status(200).json({
      success: true,
      data: membership,
      message: "Member approved successfully",
    });
  } catch (err) {
    console.error("[CoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function removeMember(req, res) {
  try {
    const { membershipId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(membershipId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    const membership = await Membership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }
    const club = await Club.findById(membership.clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    
    const isAdmin = req.user.role === "admin";
    // Coordinators are scoped to assigned clubs; admins can manage any.
    if (!isAdmin && !req.user.clubIds?.map(id => id.toString()).includes(club._id.toString())) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    
    await Membership.findByIdAndDelete(membershipId);
    await Club.findByIdAndUpdate(club._id, { $pull: { members: membership.userId } });
    return res.status(200).json({
      success: true,
      data: null,
      message: "Member removed successfully",
    });
  } catch (err) {
    console.error("[CoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function toggleRecruitment(req, res) {
  try {
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && !req.user.clubIds?.length) {
      return res.status(403).json({ success: false, message: "You are not authorized for coordinator access" });
    }

    const clubId = req.query.clubId || req.user.clubIds?.[0];
    if (!clubId) {
      return res.status(400).json({ success: false, message: "clubId is required" });
    }

    if (!isAdmin && !req.user.clubIds.map(id => id.toString()).includes(clubId.toString())) {
      return res.status(403).json({ success: false, message: "Access denied to this club" });
    }
    
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    if (!isAdmin && club.coordinator?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    club.isRecruiting = !club.isRecruiting;
    await club.save();
    return res.status(200).json({
      success: true,
      data: { isRecruiting: club.isRecruiting },
      message: "Recruitment toggled successfully",
    });
  } catch (err) {
    console.error("[CoordinatorController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
