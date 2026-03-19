// Check if user has required role
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required: ${roles.join(" or ")}`,
      });
    }
    next();
  };
}

// Check if user is admin
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
}

// Check if user is faculty coordinator or admin
export function requireCoordinator(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
  if (!["faculty_coordinator", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Faculty Coordinator access required",
    });
  }
  next();
}

// Alias for backward compatibility
export const requireLeader = requireCoordinator;
