import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import Department from "../models/Department.js";

const router = express.Router();

// All department routes require authentication
router.use(protect);

// GET all departments (any authenticated user — needed for profile dropdowns)
router.get("/", async (req, res) => {
  try {
    const depts = await Department.find().sort({ shortName: 1 }).lean();
    return res.json({ success: true, data: depts });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch departments" });
  }
});

// POST create department (admin only)
router.post("/", authorize("admin"), async (req, res) => {
  try {
    const { fullName, shortName } = req.body;
    if (!fullName?.trim() || !shortName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name and short name are required.",
      });
    }
    const normalizedShort = shortName.trim().toUpperCase();
    const existing = await Department.findOne({ shortName: normalizedShort });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Short name "${normalizedShort}" already exists.`,
      });
    }
    const dept = await Department.create({
      fullName: fullName.trim(),
      shortName: normalizedShort,
      createdBy: req.user?._id,
    });
    return res.status(201).json({ success: true, data: dept });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Short name already exists." });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to create department" });
  }
});

// PUT update department (admin only)
router.put("/:id", authorize("admin"), async (req, res) => {
  try {
    const { fullName, shortName, isActive } = req.body;
    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName.trim();
    if (shortName !== undefined)
      updates.shortName = shortName.trim().toUpperCase();
    if (isActive !== undefined) updates.isActive = isActive;

    const dept = await Department.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!dept) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }
    return res.json({ success: true, data: dept });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Short name already exists." });
    }
    return res
      .status(500)
      .json({ success: false, message: "Failed to update department" });
  }
});

// DELETE department (admin only)
router.delete("/:id", authorize("admin"), async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) {
      return res
        .status(404)
        .json({ success: false, message: "Department not found" });
    }
    return res.json({ success: true, message: "Department deleted." });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete department" });
  }
});

export default router;

