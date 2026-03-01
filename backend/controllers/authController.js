import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getAuth } from "firebase-admin/auth";
import User from "../models/User.js";

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

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }
    const hasPassword = user.password && user.password.length > 0;
    const match = hasPassword && (await bcrypt.compare(password, user.password));
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    const token = issueJwt(user._id);
    return res.status(200).json({
      success: true,
      data: { token, user: toUserResponse(user) },
      message: "Logged in successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function register(req, res) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Email, password and name are required" });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      role: "student",
      isActive: true,
    });
    const token = issueJwt(user._id);
    return res.status(201).json({
      success: true,
      data: { token, user: toUserResponse(user) },
      message: "Registered successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
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
        password: uid,
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

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: toUserResponse(user),
      },
      message: "Authenticated successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMe(req, res) {
  try {
    return res.status(200).json({ success: true, data: toUserResponse(req.user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
