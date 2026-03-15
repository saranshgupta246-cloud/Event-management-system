import jwt from "jsonwebtoken";
import { getAuth } from "firebase-admin/auth";
import User from "../models/User.js";
import { createAuditLog } from "../utils/auditLogger.js";

function issueJwt(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

function toUserResponse(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    department: user.department,
    studentId: user.studentId,
    isActive: user.isActive,
  };
}

export async function firebaseExchange(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: "idToken is required" });
    }

    let decoded;
    try {
      decoded = await getAuth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid Firebase token" });
    }

    const { uid, email, name, picture } = decoded;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email not present in token" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        password: null,
        avatar: picture || "",
        role: "student",
        isActive: true,
      });
    } else if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    // Bootstrap a single admin account based on env-configured email (case-insensitive).
    const bootstrapEmail = process.env.ADMIN_EMAIL;
    if (bootstrapEmail && email.toLowerCase() === bootstrapEmail.toLowerCase()) {
      user.role = "admin";
      user.isActive = true;
      await user.save();
    }

    const token = issueJwt(user._id);

    await createAuditLog({
      action: "USER_LOGIN",
      performedBy: user._id,
      details: { email: user.email },
      req,
    });

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: toUserResponse(user),
      },
      message: "Authenticated successfully",
    });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}

export async function getMe(req, res) {
  try {
    return res.status(200).json({ success: true, data: toUserResponse(req.user) });
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    });
  }
}
