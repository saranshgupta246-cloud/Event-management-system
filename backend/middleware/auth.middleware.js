import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import ClubMember from "../models/ClubMember.js";

function normalizeRole(dbRole) {
  if (dbRole === "admin") return "admin";
  if (dbRole === "club_leader") return "leader";
  return "student";
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role),
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  next();
}

export function requireClubAccess(minimumRank) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized" });
      }
      const clubId = req.params.clubId;
      if (!clubId || !mongoose.Types.ObjectId.isValid(clubId)) {
        return res.status(400).json({ success: false, message: "Invalid club ID" });
      }
      const member = await ClubMember.findOne({
        clubId: new mongoose.Types.ObjectId(clubId),
        userId: req.user._id,
        status: "active",
      });
      if (!member) {
        return res.status(403).json({ success: false, message: "Not a member or access denied" });
      }
      if (member.roleRank > minimumRank) {
        return res.status(403).json({ success: false, message: "Insufficient role" });
      }
      req.clubMember = member;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireClubAccessOrAdmin(minimumRank) {
  return async (req, res, next) => {
    if (req.user && req.user.role === "admin") return next();
    return requireClubAccess(minimumRank)(req, res, next);
  };
}

export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) return next();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return next();
    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role),
    };
    next();
  } catch (err) {
    next();
  }
}

export function requireStudent(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });
  if (req.user.role !== "student") return res.status(403).json({ success: false, message: "Students only" });
  next();
}

// Alias for backward compatibility
export const protect = requireAuth;
