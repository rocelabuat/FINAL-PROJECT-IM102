// middleware/roleMiddleware.js

/**
 * Middleware to check if the user is staff or admin.
 * Requires authMiddleware to run first (req.user must exist).
 */
exports.isStaff = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: "Not authenticated or role missing" });
  }

  if (req.user.role === "staff" || req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({ message: "Staff access required" });
};

/**
 * Middleware to check if the user is admin.
 * Requires authMiddleware to run first.
 */
exports.isAdmin = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: "Not authenticated or role missing" });
  }

  if (req.user.role === "admin") {
    return next();
  }

  return res.status(403).json({ message: "Admin access required" });
};
