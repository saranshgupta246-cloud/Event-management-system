import mongoose from "mongoose";
import Club from "../models/Club.js";
import Membership from "../models/Membership.js";
import { resolveClubObjectId } from "../utils/resolveClubParam.js";
import { clubNeedsSlug, ensureSlugForClubLean } from "../utils/ensureClubSlug.js";
import { appCache } from "../middleware/cache.middleware.js";

export async function getClubBySlug(req, res) {
  try {
    const param = req.params.slug;

    // Frontend passes either `slug` or (if slug is missing) Mongo `_id`.
    // Try by `slug` first, then fall back to `_id` if the parameter is an ObjectId.
    let club = await Club.findOne({ slug: param, status: "active" }).lean();

    if (!club && mongoose.Types.ObjectId.isValid(param)) {
      club = await Club.findById(param).where({ status: "active" }).lean();
    }

    if (!club) return res.status(404).json({ success: false, message: "Club not found" });

    if (clubNeedsSlug(club)) {
      club = await ensureSlugForClubLean(club);
      appCache.del("/api/clubs");
    }

    const memberCount = await Membership.countDocuments({ clubId: club._id, status: "approved" });
    return res.status(200).json({
      success: true,
      data: { ...club, memberCount },
      message: "Club fetched successfully",
    });
  } catch (err) {
    console.error("[ClubController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function joinClub(req, res) {
  try {
    const resolvedId = await resolveClubObjectId(req.params.id);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    const userId = req.user._id;
    const club = await Club.findById(resolvedId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    const existing = await Membership.findOne({ userId, clubId: resolvedId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.status === "approved" ? "Already a member" : "Join request pending",
      });
    }
    await Membership.create({ userId, clubId: resolvedId, status: "pending" });
    return res.status(201).json({
      success: true,
      data: null,
      message: "Join request submitted",
    });
  } catch (err) {
    console.error("[ClubController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function leaveClub(req, res) {
  try {
    const resolvedId = await resolveClubObjectId(req.params.id);
    if (!resolvedId) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    const userId = req.user._id;
    const membership = await Membership.findOne({ userId, clubId: resolvedId });
    if (!membership) {
      return res.status(404).json({ success: false, message: "Membership not found" });
    }
    await Membership.findByIdAndDelete(membership._id);
    await Club.findByIdAndUpdate(resolvedId, { $pull: { members: userId } });
    return res.status(200).json({
      success: true,
      data: null,
      message: "Left club successfully",
    });
  } catch (err) {
    console.error("[ClubController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
