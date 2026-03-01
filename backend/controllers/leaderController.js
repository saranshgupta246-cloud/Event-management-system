import Club from "../models/Club.js";
import Membership from "../models/Membership.js";

export async function getMyClub(req, res) {
  try {
    if (req.user.role !== "club_leader" || !req.user.clubId) {
      return res.status(403).json({ success: false, message: "You are not a club leader" });
    }
    const club = await Club.findById(req.user.clubId)
      .populate("leader", "name email")
      .lean();
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    if (club.leader._id.toString() !== req.user._id.toString()) {
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
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function approveMember(req, res) {
  try {
    const { membershipId } = req.params;
    const membership = await Membership.findById(membershipId).populate("clubId");
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }
    const club = await Club.findById(membership.clubId._id || membership.clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    if (club.leader.toString() !== req.user._id.toString()) {
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
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function removeMember(req, res) {
  try {
    const { membershipId } = req.params;
    const membership = await Membership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }
    const club = await Club.findById(membership.clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    if (club.leader.toString() !== req.user._id.toString()) {
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
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function toggleRecruitment(req, res) {
  try {
    if (!req.user.clubId) {
      return res.status(403).json({ success: false, message: "You are not a club leader" });
    }
    const club = await Club.findById(req.user.clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    if (club.leader.toString() !== req.user._id.toString()) {
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
    return res.status(500).json({ success: false, message: err.message });
  }
}
