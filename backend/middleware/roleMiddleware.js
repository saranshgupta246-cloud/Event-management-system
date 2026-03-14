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

// Check if user is leader or admin
export function requireLeader(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authorized",
    });
  }
  if (!["leader", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Leader access required",
    });
  }
  next();
}
