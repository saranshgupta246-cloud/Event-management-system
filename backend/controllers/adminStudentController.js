import mongoose from "mongoose";
import { z } from "zod";
import User from "../models/User.js";
import { createAuditLog } from "../utils/auditLogger.js";

const listStudentsQuerySchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  year: z
    .preprocess((v) => (v === undefined ? undefined : Number(v)), z.number().int().min(1).max(8))
    .optional(),
  page: z
    .preprocess((v) => (v === undefined ? 1 : Number(v)), z.number().int().min(1))
    .optional(),
  limit: z
    .preprocess((v) => (v === undefined ? 20 : Number(v)), z.number().int().min(1).max(100))
    .optional(),
});

const adminUpdateStudentSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(5).max(20).optional(),
  department: z.string().max(120).optional(),
  year: z.number().int().min(1).max(8).optional(),
  bio: z.string().max(1000).optional(),
  avatar: z.string().url().optional(),
  role: z.enum(["student", "club_leader", "faculty", "admin"]).optional(),
  isActive: z.boolean().optional(),
  clubId: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid clubId",
    })
    .optional(),
});

export async function listStudents(req, res) {
  try {
    const parsed = listStudentsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("; ");
      return res.status(400).json({ success: false, message: msg });
    }
    const { search, department, year, page = 1, limit = 20 } = parsed.data;

    // Show all user roles (students, leaders, faculty, faculty coordinators, admins)
    const filter = {};
    if (department) filter.department = department;
    if (year) filter.year = year;
    if (search && String(search).trim()) {
      const escaped = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: new RegExp(escaped, "i") },
        { email: new RegExp(escaped, "i") },
        { studentId: new RegExp(escaped, "i") },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page,
        pages: totalPages,
      },
      message: "Students fetched successfully",
    });
  } catch (err) {
    console.error("[AdminStudentController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getStudentById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }
    const user = await User.findById(id).select("-password").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      data: user,
      message: "Student fetched successfully",
    });
  } catch (err) {
    console.error("[AdminStudentController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function updateStudentById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const parsed = adminUpdateStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.errors.map((e) => e.message).join("; ");
      return res.status(400).json({ success: false, message: msg });
    }

    const updates = parsed.data;

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (updates.role !== undefined) {
      await createAuditLog({
        action: "USER_ROLE_CHANGED",
        performedBy: req.user._id,
        targetUser: id,
        targetModel: "User",
        details: { newRole: updates.role },
        req,
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Student updated successfully",
    });
  } catch (err) {
    console.error("[AdminStudentController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

