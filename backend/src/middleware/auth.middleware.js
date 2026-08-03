import Admin from "../models/admin.model.js";
import { verifyRequestToken, getUserFromRequest } from "../lib/auth/authUtils.js";

// ============================================================
// AUTH MIDDLEWARE
// ------------------------------------------------------------
// JWT-based authentication + authorization middleware.
// Passport sessions are NOT used. JWT is the only mechanism.
// ============================================================

/**
 * Protect — require a valid JWT and an existing, active user.
 * Attaches `req.user` (Mongoose doc) and `req.auth` (token payload).
 */
export const protect = async (req, res, next) => {
  try {
    const payload = verifyRequestToken(req);
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route. Please login.",
      });
    }

    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
      });
    }

    if (user.status === "blocked" || user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact support.",
      });
    }

    req.user = user;
    req.auth = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route.",
    });
  }
};

/**
 * optionalAuth — attach the user if a valid token exists, but never block.
 * Sets `req.user` / `req.auth` to null when unauthenticated.
 */
export const optionalAuth = async (req, _res, next) => {
  try {
    req.user = await getUserFromRequest(req);
    req.auth = verifyRequestToken(req) || null;
  } catch {
    req.user = null;
    req.auth = null;
  }
  next();
};

/**
 * restrictTo — role-based access control. Must run after `protect`.
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized. Allowed roles: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * isAdmin — verify the user is an active admin. Must run after `protect`.
 */
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login.",
      });
    }

    const admin = await Admin.findOne({ userId: req.user._id, isActive: true });
    if (!admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify admin privileges.",
    });
  }
};

/**
 * isVerified — require a verified account. Must run after `protect`.
 */
export const isVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated. Please login.",
    });
  }

  if (!req.user.verified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your account to access this feature.",
    });
  }

  next();
};

/**
 * isProfileComplete — role-aware profile completion check.
 * Must run after `protect`. Uses correct model import path.
 */
export const isProfileComplete = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated. Please login.",
    });
  }

  const user = req.user;

  try {
    if (user.role === "founder") {
      const Startup = (await import("../models/startup.model.js")).default;
      const startup = await Startup.findOne({ ownerId: user._id });
      if (!startup) {
        return res.status(403).json({
          success: false,
          message: "Please create a startup profile first.",
        });
      }
    }

    if (user.role === "investor") {
      if (!user.investorProfile || !user.investorProfile.investmentRange) {
        return res.status(403).json({
          success: false,
          message: "Please complete your investor profile first.",
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to verify profile completion.",
    });
  }
};

