import mongoose from "mongoose";
import Club from "../models/Club.js";
import User from "../models/User.js";
import Membership from "../models/Membership.js";
import Event from "../models/Event.js";
import { generateSlug } from "../utils/generateSlug.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { localUpload } from "../utils/localUpload.js";

export async function createClub(req, res) {
  try {
    const { name, description, category, logo, banner, coordinatorEmail, coordinatorId } = req.body;
    
    // Validate category
    const validCategories = ["technical", "cultural", "sports", "literary", "other"];
    const normalizedCategory = category?.toLowerCase();
    if (!normalizedCategory || !validCategories.includes(normalizedCategory)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid category. Must be one of: ${validCategories.join(", ")}` 
      });
    }
    
    // Find coordinator by ID or email
    let coordinator = null;
    if (coordinatorId) {
      coordinator = await User.findById(coordinatorId);
    } else if (coordinatorEmail) {
      coordinator = await User.findOne({ email: coordinatorEmail.toLowerCase().trim() });
    }
    
    if (!coordinator) {
      return res.status(400).json({ 
        success: false, 
        message: "Faculty coordinator not found. Please provide a valid coordinator." 
      });
    }
    
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
      category: normalizedCategory,
      logoUrl: logo || "",
      bannerUrl: banner || "",
      createdBy: req.user._id,
      coordinator: coordinator._id,
    });
    
    // Update coordinator's role and clubIds
    await User.findByIdAndUpdate(coordinator._id, {
      role: "faculty_coordinator",
      $addToSet: { clubIds: club._id }
    });
    
    // Create membership for coordinator
    await Membership.create({
      userId: coordinator._id,
      clubId: club._id,
      clubRole: "Faculty Coordinator",
      roleRank: 0,
      status: "approved",
    });
    
    await createAuditLog({
      action: "CLUB_CREATED",
      performedBy: req.user._id,
      targetId: club._id,
      targetModel: "Club",
      details: { name: club.name, coordinator: coordinator.email },
      req,
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
    await createAuditLog({
      action: "CLUB_UPDATED",
      performedBy: req.user._id,
      targetId: club._id,
      targetModel: "Club",
      details: { name: club.name },
      req,
    });
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
    
    // First, get the club details before deleting (for audit log)
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });
    
    // Save club details for audit log before deletion
    const clubDetails = {
      name: club.name,
      category: club.category,
      description: club.description,
      coordinatorId: club.coordinator?.toString(),
      memberCount: club.memberCount || 0,
      status: club.status,
    };
    
    // Count related items before deletion
    const [membershipCount, eventCount] = await Promise.all([
      Membership.countDocuments({ clubId: club._id }),
      Event.countDocuments({ clubId: club._id }),
    ]);

    // Delete the club and related data
    await Club.findByIdAndDelete(req.params.id);
    
    const [membershipsResult, eventsResult] = await Promise.all([
      Membership.deleteMany({ clubId: club._id }),
      Event.deleteMany({ clubId: club._id }),
    ]);

    // Remove this club from all users' clubIds array
    await User.updateMany(
      { clubIds: club._id }, 
      { $pull: { clubIds: club._id } }
    );
    
    // Reset role to student for users who no longer have any clubs
    const usersWithNoClubs = await User.find({ 
      role: "faculty_coordinator", 
      $or: [{ clubIds: { $size: 0 } }, { clubIds: { $exists: false } }]
    });
    for (const user of usersWithNoClubs) {
      user.role = "student";
      await user.save();
    }

    // Create audit log for the deletion
    await createAuditLog({
      action: "CLUB_DELETED",
      performedBy: req.user._id,
      targetId: req.params.id,
      targetModel: "Club",
      details: {
        ...clubDetails,
        deletedMemberships: membershipsResult.deletedCount,
        deletedEvents: eventsResult.deletedCount,
        previousMemberCount: membershipCount,
        previousEventCount: eventCount,
      },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    });

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

export async function assignCoordinator(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });
    
    const { userId, email } = req.body;
    let newCoordinator;
    
    if (userId) {
      newCoordinator = await User.findById(userId);
    } else if (email) {
      newCoordinator = await User.findOne({ email: email.toLowerCase().trim() });
    }
    
    if (!newCoordinator) return res.status(404).json({ success: false, message: "User not found" });
    
    const oldCoordinatorId = club.coordinator;
    club.coordinator = newCoordinator._id;
    club.isOrphaned = false;
    await club.save();
    
    // Handle old coordinator
    if (oldCoordinatorId && oldCoordinatorId.toString() !== newCoordinator._id.toString()) {
      // Remove this club from old coordinator's clubIds
      await User.findByIdAndUpdate(oldCoordinatorId, { 
        $pull: { clubIds: club._id } 
      });
      
      // Update old coordinator's membership to Member role
      await Membership.updateOne(
        { userId: oldCoordinatorId, clubId: club._id }, 
        { clubRole: "Member", roleRank: 6 }
      );
      
      // Check if old coordinator has any other clubs
      const oldCoord = await User.findById(oldCoordinatorId);
      if (oldCoord && (!oldCoord.clubIds || oldCoord.clubIds.length === 0)) {
        oldCoord.role = "student";
        await oldCoord.save();
      }
      
      // Remove temporary powers from any president
      await Membership.updateMany(
        { clubId: club._id, hasTemporaryPowers: true },
        { hasTemporaryPowers: false }
      );
    }
    
    // Set up new coordinator
    await User.findByIdAndUpdate(newCoordinator._id, { 
      role: "faculty_coordinator",
      $addToSet: { clubIds: club._id }
    });
    
    // Create or update membership for new coordinator
    let membership = await Membership.findOne({ userId: newCoordinator._id, clubId: club._id });
    if (!membership) {
      await Membership.create({ 
        userId: newCoordinator._id, 
        clubId: club._id, 
        clubRole: "Faculty Coordinator",
        roleRank: 0, 
        status: "approved" 
      });
    } else {
      membership.clubRole = "Faculty Coordinator";
      membership.roleRank = 0;
      membership.status = "approved";
      await membership.save();
    }
    
    await createAuditLog({
      action: "COORDINATOR_ASSIGNED",
      performedBy: req.user._id,
      targetId: club._id,
      targetModel: "Club",
      details: { clubName: club.name, coordinator: newCoordinator.email },
      req,
    });
    
    return res.status(200).json({ 
      success: true, 
      data: { club, coordinator: newCoordinator }, 
      message: "Coordinator assigned successfully" 
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

// Alias for backward compatibility
export const assignLeader = assignCoordinator;

export async function uploadClubLogo(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided." });
    }

    const { buffer, mimetype, originalname, size } = req.file;

    if (!mimetype.startsWith("image/")) {
      return res
        .status(400)
        .json({ success: false, message: "Only image files are allowed." });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum 5MB allowed",
      });
    }

    const url = await localUpload({
      buffer,
      mimetype,
      folder: "club-logos",
      filename: originalname,
    });

    return res.status(200).json({
      success: true,
      url,
      message: "Club logo uploaded successfully",
    });
  } catch (err) {
    console.error("[AdminClubController] uploadClubLogo", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

// Bulk import clubs from CSV
// CSV Format: club_name,faculty_email,club_field
export async function bulkImportClubs(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No CSV file provided" });
    }

    const csvContent = req.file.buffer.toString("utf-8");
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ success: false, message: "CSV file is empty or has no data rows" });
    }

    const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
    const nameIdx = headers.indexOf("club_name");
    const emailIdx = headers.indexOf("faculty_email");
    const fieldIdx = headers.indexOf("club_field");
    
    if (nameIdx === -1 || emailIdx === -1 || fieldIdx === -1) {
      return res.status(400).json({ 
        success: false, 
        message: "CSV must have columns: club_name, faculty_email, club_field" 
      });
    }

    const validCategories = ["technical", "cultural", "sports", "literary", "other"];
    const results = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map(cell => cell.trim());
      const clubName = row[nameIdx];
      const facultyEmail = row[emailIdx]?.toLowerCase();
      const clubField = row[fieldIdx]?.toLowerCase();

      if (!clubName || !facultyEmail || !clubField) {
        results.errors.push({ row: i + 1, error: "Missing required fields" });
        results.skipped++;
        continue;
      }

      // Validate category
      if (!validCategories.includes(clubField)) {
        results.errors.push({ row: i + 1, clubName, error: `Invalid club_field. Must be one of: ${validCategories.join(", ")}` });
        results.skipped++;
        continue;
      }

      // Find faculty by email
      const coordinator = await User.findOne({ email: facultyEmail });
      if (!coordinator) {
        results.errors.push({ row: i + 1, clubName, facultyEmail, error: "Faculty not found in system" });
        results.skipped++;
        continue;
      }

      // Check if club name already exists
      const existingClub = await Club.findOne({ name: { $regex: new RegExp(`^${clubName}$`, "i") } });
      if (existingClub) {
        results.errors.push({ row: i + 1, clubName, error: "Club name already exists" });
        results.skipped++;
        continue;
      }

      // Generate unique slug
      let slug = generateSlug(clubName);
      let slugExists = await Club.findOne({ slug });
      let counter = 0;
      while (slugExists) {
        counter += 1;
        slug = generateSlug(clubName) + "-" + counter;
        slugExists = await Club.findOne({ slug });
      }

      // Create club
      const club = await Club.create({
        name: clubName,
        slug,
        description: "",
        category: clubField,
        createdBy: req.user._id,
        coordinator: coordinator._id,
      });

      // Update coordinator's role and clubIds
      await User.findByIdAndUpdate(coordinator._id, {
        role: "faculty_coordinator",
        $addToSet: { clubIds: club._id }
      });

      // Create membership for coordinator
      await Membership.create({
        userId: coordinator._id,
        clubId: club._id,
        clubRole: "Faculty Coordinator",
        roleRank: 0,
        status: "approved",
      });

      results.created++;
    }

    await createAuditLog({
      action: "BULK_CLUBS_IMPORTED",
      performedBy: req.user._id,
      targetModel: "Club",
      details: { created: results.created, skipped: results.skipped },
      req,
    });

    return res.status(200).json({
      success: true,
      data: results,
      message: `Import complete: ${results.created} clubs created, ${results.skipped} rows skipped`,
    });
  } catch (err) {
    console.error("[AdminClubController] bulkImportClubs", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

// Search users for coordinator assignment (by email)
export async function searchUsersForCoordinator(req, res) {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escaped, "i");
    
    const users = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    })
      .select("name email avatar role")
      .limit(20)
      .lean();
    
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error("[AdminClubController] searchUsersForCoordinator", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

// Remove coordinator from club (orphan the club)
// President gets temporary powers until new coordinator is assigned
export async function removeCoordinator(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
    
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }
    
    const oldCoordinatorId = club.coordinator;
    if (!oldCoordinatorId) {
      return res.status(400).json({ success: false, message: "Club has no coordinator to remove" });
    }
    
    // Remove coordinator from club
    club.coordinator = null;
    club.isOrphaned = true;
    await club.save();
    
    // Remove this club from old coordinator's clubIds
    await User.findByIdAndUpdate(oldCoordinatorId, { 
      $pull: { clubIds: club._id } 
    });
    
    // Update old coordinator's membership to Member role
    await Membership.updateOne(
      { userId: oldCoordinatorId, clubId: club._id }, 
      { clubRole: "Member", roleRank: 6 }
    );
    
    // Check if old coordinator has any other clubs
    const oldCoord = await User.findById(oldCoordinatorId);
    if (oldCoord && (!oldCoord.clubIds || oldCoord.clubIds.length === 0)) {
      oldCoord.role = "student";
      await oldCoord.save();
    }
    
    // Grant temporary powers to President if exists
    const president = await Membership.findOne({
      clubId: club._id,
      clubRole: "President",
      status: "approved",
    });
    
    if (president) {
      president.hasTemporaryPowers = true;
      await president.save();
    }
    
    await createAuditLog({
      action: "COORDINATOR_REMOVED",
      performedBy: req.user._id,
      targetId: club._id,
      targetModel: "Club",
      details: { 
        clubName: club.name, 
        removedCoordinator: oldCoord?.email,
        presidentHasTemporaryPowers: !!president 
      },
      req,
    });
    
    return res.status(200).json({ 
      success: true, 
      data: { 
        club,
        isOrphaned: true,
        presidentHasTemporaryPowers: !!president,
      }, 
      message: president 
        ? "Coordinator removed. President has been granted temporary powers." 
        : "Coordinator removed. Club is now orphaned with no active manager.",
    });
  } catch (err) {
    console.error("[AdminClubController] removeCoordinator", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

