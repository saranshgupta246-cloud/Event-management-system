import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import Membership from "../models/Membership.js";
import { resolveClubObjectId } from "../utils/resolveClubParam.js";

function normalizeRole(dbRole) {
  if (dbRole === "admin") return "admin";
  if (dbRole === "faculty_coordinator") return "faculty_coordinator";
  if (dbRole === "faculty") return "faculty";
  return "student";
}

/** Throttle writes: at most one lastLogin update per user per window (admin "Last Login" / last seen). */
const LAST_LOGIN_THROTTLE_MS = 10 * 60 * 1000;

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

    const cutoff = new Date(Date.now() - LAST_LOGIN_THROTTLE_MS);
    await User.updateOne(
      {
        _id: user._id,
        $or: [{ lastLogin: null }, { lastLogin: { $lt: cutoff } }],
      },
      { $set: { lastLogin: new Date() } }
    );

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: normalizeRole(user.role),
      clubIds: user.clubIds ?? [],
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
      const raw = req.params.clubId;
      if (!raw || !String(raw).trim()) {
        return res.status(400).json({ success: false, message: "Invalid club ID" });
      }
      const resolvedId = await resolveClubObjectId(raw);
      if (!resolvedId) {
        return res.status(404).json({ success: false, message: "Club not found" });
      }
      const clubIdStr = resolvedId.toString();

      // Check if user is faculty coordinator for this club
      if (req.user.role === "faculty_coordinator" && 
          req.user.clubIds?.map(id => id.toString()).includes(clubIdStr)) {
        req.clubMember = { roleRank: 0, clubRole: "Faculty Coordinator" };
        req.resolvedClubId = resolvedId;
        return next();
      }
      
      const member = await Membership.findOne({
        clubId: resolvedId,
        userId: req.user._id,
        status: "approved",
      });
      if (!member) {
        return res.status(403).json({ success: false, message: "Not a member or access denied" });
      }
      
      // Check for temporary powers (orphaned club president)
      let effectiveRank = member.roleRank;
      if (member.hasTemporaryPowers && member.clubRole === "President") {
        effectiveRank = 0; // Grant coordinator-level access
      }
      
      if (effectiveRank > minimumRank) {
        return res.status(403).json({ success: false, message: "Insufficient role" });
      }
      req.clubMember = member;
      req.resolvedClubId = resolvedId;
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

// Coordinator only - for recruitment creation
export function requireCoordinatorOnly(clubIdParam = "clubId") {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized" });
      }
      
      // Admin has full access
      if (req.user.role === "admin") return next();
      
      const raw = req.params[clubIdParam] || req.body.clubId;
      if (!raw || !String(raw).trim()) {
        return res.status(400).json({ success: false, message: "Invalid club ID" });
      }
      const resolvedId = await resolveClubObjectId(raw);
      if (!resolvedId) {
        return res.status(404).json({ success: false, message: "Club not found" });
      }
      const clubIdStr = resolvedId.toString();

      // Check if user is faculty coordinator for this club
      if (req.user.role === "faculty_coordinator" && 
          req.user.clubIds?.map(id => id.toString()).includes(clubIdStr)) {
        req.clubMember = { roleRank: 0, clubRole: "Faculty Coordinator" };
        req.resolvedClubId = resolvedId;
        return next();
      }
      
      return res.status(403).json({ 
        success: false, 
        message: "Only Faculty Coordinators can perform this action" 
      });
    } catch (err) {
      next(err);
    }
  };
}

// Coordinator or President - for events, member management
export function requireCoordinatorOrPresident(clubIdParam = "clubId") {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized" });
      }
      
      // Admin has full access
      if (req.user.role === "admin") return next();
      
      const raw = req.params[clubIdParam] || req.body.clubId;
      if (!raw || !String(raw).trim()) {
        return res.status(400).json({ success: false, message: "Invalid club ID" });
      }
      const resolvedId = await resolveClubObjectId(raw);
      if (!resolvedId) {
        return res.status(404).json({ success: false, message: "Club not found" });
      }
      const clubIdStr = resolvedId.toString();

      // Check if user is faculty coordinator for this club
      if (req.user.role === "faculty_coordinator" && 
          req.user.clubIds?.map(id => id.toString()).includes(clubIdStr)) {
        req.clubMember = { roleRank: 0, clubRole: "Faculty Coordinator" };
        req.isCoordinator = true;
        req.resolvedClubId = resolvedId;
        return next();
      }
      
      // Check if user is President in this club
      const member = await Membership.findOne({
        clubId: resolvedId,
        userId: req.user._id,
        status: "approved",
        clubRole: "President",
      });
      
      if (member) {
        req.clubMember = member;
        req.isPresident = true;
        req.hasTemporaryPowers = member.hasTemporaryPowers || false;
        req.resolvedClubId = resolvedId;
        return next();
      }
      
      return res.status(403).json({ 
        success: false, 
        message: "Only Faculty Coordinators or Presidents can perform this action" 
      });
    } catch (err) {
      next(err);
    }
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
      clubIds: user.clubIds ?? [],
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
