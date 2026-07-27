const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];
      console.log(`[DEBUG AUTH BACKEND] ${req.method} ${req.originalUrl} - Bearer token found. Verifying...`);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`[DEBUG AUTH BACKEND] ${req.method} ${req.originalUrl} - Token verified. User ID: ${decoded.id}`);

      // Get user from the token (attach to req, exclude password)
      req.user = await User.findById(decoded.id).select("-password");
      console.log(`[DEBUG AUTH BACKEND] ${req.method} ${req.originalUrl} - User attached. Role: ${req.user ? req.user.role : "null"}`);

      next();
    } catch (error) {
      console.error(`[DEBUG AUTH BACKEND] ${req.method} ${req.originalUrl} - Token verification failed:`, error.message);
      res.status(401);
      const err = new Error("Not authorized, token failed");
      next(err);
    }
  }

  if (!token) {
    console.warn(`[DEBUG AUTH BACKEND] ${req.method} ${req.originalUrl} - No token found in Authorization header`);
    res.status(401);
    const err = new Error("Not authorized, no token");
    next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      console.error(error);
    }
  }
  next();
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403);
      const err = new Error(
        `User role ${req.user.role} is not authorized to access this route`
      );
      next(err);
    }
  };
};

// Convenience middleware for Admin only
const requireAdmin = [protect, authorize("admin")];

// Security Gate for Guides
// Hard-blocks any guide whose status is not fully 'verified'
const requireVerifiedGuide = [
  protect, 
  authorize("guide"),
  (req, res, next) => {
    if (req.user.guideStatus !== "verified" && req.user.guideStatus !== "approved") {
      res.status(403);
      return next(new Error("SECURITY CLEARANCE REQUIRED: Guide profile is pending or rejected. Document verification is required to perform this action."));
    }
    if (req.user.schedulingDisabled) {
      res.status(403);
      return next(new Error("Scheduling privileges have been revoked by an administrator."));
    }
    next();
  }
];

const requireEmailVerified = (req, res, next) => {
  if (!req.user?.isEmailVerified) {
    res.status(403);
    return next(new Error("Please verify your email before continuing"));
  }
  next();
};

module.exports = {
  protect,
  authorize,
  requireAdmin,
  requireVerifiedGuide,
  requireEmailVerified,
  optionalAuth,
};
