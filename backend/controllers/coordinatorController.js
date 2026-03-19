import mongoose from "mongoose";
import Club from "../models/Club.js";
import Membership from "../models/Membership.js";

export async function getMyClub(req, res) {
  try {
    if (req.user.role !== "faculty_coordinator" || !req.user.clubIds?.length) {
      return res.status(403).json({ success: false, message: "You are not a faculty coordinator" });
    }
    
    // Get first club from array (can be extended to support multiple clubs)
    const clubId = req.query.clubId || req.user.clubIds[0];
    
    if (!req.user.clubIds.map(id => id.toString()).includes(clubId.toString())) {
      return res.status(403).json({ success: false, message: "Access denied to this club" });
    }
    
    const club = await Club.findById(clubId)
      .populate("coordinator", "name email")
      .lean();
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    if (club.coordinator?._id?.toString() !== req.user._id.toString()) {
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

export async function getMyClubs(req, res) {
  try {
    if (req.user.role !== "faculty_coordinator" || !req.user.clubIds?.length) {
      return res.status(403).json({ success: false, message: "You are not a faculty coordinator" });
    }
    
    const clubs = await Club.find({ _id: { $in: req.user.clubIds } })
      .populate("coordinator", "name email")
      .lean();
    
    const clubsWithStats = await Promise.all(
      clubs.map(async (club) => {
        const memberCount = await Membership.countDocuments({ clubId: club._id, status: "approved" });
        const pendingCount = await Membership.countDocuments({ clubId: club._id, status: "pending" });
        return { ...club, memberCount, pendingCount };
      })
    );
    
    return res.status(200).json({
      success: true,
      data: clubsWithStats,
      message: "Clubs fetched successfully",
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
    
    // Check if user is coordinator of this club
    if (!req.user.clubIds?.map(id => id.toString()).includes(club._id.toString())) {
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
    
    // Check if user is coordinator of this club
    if (!req.user.clubIds?.map(id => id.toString()).includes(club._id.toString())) {
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
    if (!req.user.clubIds?.length) {
      return res.status(403).json({ success: false, message: "You are not a faculty coordinator" });
    }
    
    const clubId = req.query.clubId || req.user.clubIds[0];
    
    if (!req.user.clubIds.map(id => id.toString()).includes(clubId.toString())) {
      return res.status(403).json({ success: false, message: "Access denied to this club" });
    }
    
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    if (club.coordinator?.toString() !== req.user._id.toString()) {
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
