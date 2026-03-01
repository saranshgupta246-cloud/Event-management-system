import Club from "../models/Club.js";
import Membership from "../models/Membership.js";

export async function getAllClubs(req, res) {
  try {
    const { category, search, recruiting } = req.query;
    const filter = { status: "active" };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { name: new RegExp(search, "i") },
        { description: new RegExp(search, "i") },
      ];
    }
    if (recruiting === "true") filter.isRecruiting = true;

    const clubs = await Club.find(filter)
      .populate("leader", "name email")
      .lean();
    const withCounts = await Promise.all(
      clubs.map(async (c) => {
        const memberCount = await Membership.countDocuments({ clubId: c._id, status: "approved" });
        return { ...c, memberCount };
      })
    );
    return res.status(200).json({
      success: true,
      data: withCounts,
      message: "Clubs fetched successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getClubBySlug(req, res) {
  try {
    const club = await Club.findOne({ slug: req.params.slug, status: "active" })
      .populate("leader", "name email")
      .lean();
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    const memberCount = await Membership.countDocuments({ clubId: club._id, status: "approved" });
    return res.status(200).json({
      success: true,
      data: { ...club, memberCount },
      message: "Club fetched successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function joinClub(req, res) {
  try {
    const clubId = req.params.id;
    const userId = req.user._id;
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    const existing = await Membership.findOne({ userId, clubId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.status === "approved" ? "Already a member" : "Join request pending",
      });
    }
    await Membership.create({ userId, clubId, status: "pending" });
    return res.status(201).json({
      success: true,
      data: null,
      message: "Join request submitted",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function leaveClub(req, res) {
  try {
    const clubId = req.params.id;
    const userId = req.user._id;
    const membership = await Membership.findOne({ userId, clubId });
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }
    await Membership.findByIdAndDelete(membership._id);
    await Club.findByIdAndUpdate(clubId, { $pull: { members: userId } });
    return res.status(200).json({
      success: true,
      data: null,
      message: "Left club successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
