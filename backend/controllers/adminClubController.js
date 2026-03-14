import mongoose from "mongoose";
import Club from "../models/Club.js";
import User from "../models/User.js";
import Membership from "../models/Membership.js";
import Event from "../models/Event.js";
import { generateSlug } from "../utils/generateSlug.js";

export async function createClub(req, res) {
  try {
    const { name, description, category, logo, banner } = req.body;
    let slug = generateSlug(name);
    let exists = await Club.findOne({ slug });
    let counter = 0;
    while (exists) {
      counter += 1;
      slug = generateSlug(name) + "-" + counter;
      exists = await Club.findOne({ slug });
    }
    const club = await Club.create({
      name,
      slug,
      description: description || "",
      category: category || "",
      logo: logo || "",
      banner: banner || "",
      createdBy: req.user._id,
    });
    return res.status(201).json({
      success: true,
      data: club,
      message: "Club created successfully",
    });
  } catch (err) {
    console.error("[AdminClubController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function updateClub(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });
    const { name, description, category, logo, banner, status } = req.body;
    if (name) club.name = name;
    if (description !== undefined) club.description = description;
    if (category !== undefined) club.category = category;
    if (logo !== undefined) club.logo = logo;
    if (banner !== undefined) club.banner = banner;
    if (status) club.status = status;
    await club.save();
    return res.status(200).json({ success: true, data: club, message: "Club updated successfully" });
  } catch (err) {
    console.error("[AdminClubController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function deleteClub(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    const club = await Club.findByIdAndDelete(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });

    const [membershipsResult, eventsResult] = await Promise.all([
      Membership.deleteMany({ clubId: club._id }),
      Event.deleteMany({ clubId: club._id }),
    ]);

    await User.updateMany({ clubId: club._id }, { $set: { clubId: null, role: "student" } });

    return res.status(200).json({
      success: true,
      data: {
        deletedMemberships: membershipsResult.deletedCount,
        deletedEvents: eventsResult.deletedCount,
      },
      message: `Club deleted. ${eventsResult.deletedCount} events and ${membershipsResult.deletedCount} memberships removed.`,
    });
  } catch (err) {
    console.error("[AdminClubController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function assignLeader(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });
    const userId = req.body.userId;
    const newLeader = await User.findById(userId);
    if (!newLeader) return res.status(404).json({ success: false, message: "User not found" });
    const oldLeaderId = club.leader;
    club.leader = newLeader._id;
    await club.save();
    if (oldLeaderId) {
      await User.findByIdAndUpdate(oldLeaderId, { role: "student", clubId: null });
      await Membership.updateOne({ userId: oldLeaderId, clubId: club._id }, { role: "member" });
    }
    await User.findByIdAndUpdate(newLeader._id, { role: "club_leader", clubId: club._id });
    let membership = await Membership.findOne({ userId: newLeader._id, clubId: club._id });
    if (!membership) {
      await Membership.create({ userId: newLeader._id, clubId: club._id, role: "leader", status: "approved" });
    } else {
      await Membership.updateOne({ userId: newLeader._id, clubId: club._id }, { role: "leader", status: "approved" });
    }
    await Club.findByIdAndUpdate(club._id, { $addToSet: { members: newLeader._id } });
    return res.status(200).json({ success: true, data: { club, leader: newLeader }, message: "Leader assigned successfully" });
  } catch (err) {
    console.error("[AdminClubController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
