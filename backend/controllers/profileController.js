import User from "../models/User.js";
import { z } from "zod";
import cloudinary from "../config/cloudinary.js";
import { localUpload } from "../utils/localUpload.js";

const socialLinkSchema = z.string().max(300).optional().nullable();

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  phone: z.string().min(5).max(20).optional(),
  department: z.string().max(120).optional(),
  year: z.number().int().min(1).max(8).optional(),
  bio: z.string().max(1000).optional(),
  avatar: z.string().url().optional().nullable(),
  socialLinks: z
    .object({
      github: socialLinkSchema,
      linkedin: socialLinkSchema,
      twitter: socialLinkSchema,
      website: socialLinkSchema,
    })
    .optional(),
});

export async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: user,
      message: "Profile fetched successfully",
    });
  } catch (err) {
    console.error("[ProfileController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function updateMyProfile(req, res) {
  try {
    const parseResult = profileUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      const msg = parseResult.error.errors.map((e) => e.message).join("; ");
      return res.status(400).json({ success: false, message: msg });
    }

    const updates = parseResult.data;

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Profile updated successfully",
    });
  } catch (err) {
    console.error("[ProfileController]", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

/**
 * POST /api/profile/avatar
 * Accepts multipart/form-data with field "avatar".
 * Uploads to Cloudinary, saves URL to user record, returns URL.
 */
export async function uploadAvatarImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided." });
    }

    const { buffer, mimetype, originalname } = req.file;

    if (!mimetype.startsWith("image/")) {
      return res.status(400).json({ success: false, message: "Only image files are allowed." });
    }

    // Save avatar locally instead of uploading to Cloudinary.
    const avatarUrl = await localUpload({
      buffer,
      mimetype,
      folder: "avatars",
      filename: originalname,
    });

    await User.findByIdAndUpdate(req.user._id, { $set: { avatar: avatarUrl } });

    return res.status(200).json({
      success: true,
      url: avatarUrl,
      message: "Avatar uploaded successfully",
    });
  } catch (err) {
    console.error("[ProfileController]", err);
    return res.status(500).json({ success: false, message:
        process.env.NODE_ENV === "development" ? (err.message || "Upload failed.") : "Something went wrong", });
  }
}
