import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../services/email.service.js";
import { signAuthToken } from "../lib/auth/jwt.js";
import { generateOTP } from "../services/otp.service.js";

// ============================================================
// AUTH CONTROLLER
// ------------------------------------------------------------
// Response shapes are CONSISTENT across all endpoints:
//   success : { success: true, data: {...} }
//   error   : { success: false, message: string }
// Login/verify also attach `token` at the top level for
// backwards compatibility with existing frontend callers.
// ============================================================

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/**
 * Format a user document into the public shape shared by all
 * auth endpoints. Keeps responses consistent and hides sensitive data.
 * NOTE: Renamed from serializeUser to formatAuthResponse to avoid
 * confusion with Passport.js session serialization.
 */
export function formatAuthResponse(user) {
  return {
    id: user._id.toString(),
    name: user.name || null,
    email: user.email,
    role: user.role || null,
    avatar: user.profilePicture || user.avatar || null,
    profilePicture: user.profilePicture || null,
    verified: !!user.verified,
    isProfileComplete: !!user.isProfileComplete,
    status: user.status || "active",
    investorProfile: user.investorProfile || null,
    founderProfile: user.founderProfile || null,
    createdAt: user.createdAt || null,
  };
}

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

/**
 * Find a user by email case-insensitively (schema stores lowercase,
 * but this is belt-and-braces).
 */
async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return User.findOne({
    email: { $regex: `^${escaped}$`, $options: "i" },
  });
}

/**
 * Issue a token for a user. If the user has no role yet, fall back to a
 * legacy-style token so onboarding can continue (same behavior as before).
 */
function issueToken(user, provider = "email") {
  if (!user.role) {
    return jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  }
  return signAuthToken(user, { provider });
}

// ------------------------------------------------------------
// Signup (email + OTP)
// ------------------------------------------------------------

export const signup = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({ success: false, message: "Email required" });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please log in instead.",
      });
    }

    const otp = generateOTP();
    await User.create({
      email,
      otp,
      otpExpiry: new Date(Date.now() + OTP_TTL_MS),
    });

    try {
      await sendEmail({
        to: email,
        subject: "Your Travest OTP",
        text: `Your OTP is ${otp}. Expires in 10 minutes.`,
        html: `<p>Your OTP is <b>${otp}</b>. Expires in 10 minutes.</p>`,
      });
    } catch (emailErr) {
      // Log but do not fail the request; user can retry verification.
      console.error("OTP email failed:", emailErr.message);
    }

    return res.json({ success: true, data: { otpSent: true } });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please log in instead.",
      });
    }
    console.error("Signup error:", err);
    return res.status(500).json({ success: false, message: "Failed to sign up" });
  }
};

// ------------------------------------------------------------
// Verify OTP
// ------------------------------------------------------------

export const verifyOTP = async (req, res) => {
  try {
    const { otp, email } = req.body;
    const normalized = normalizeEmail(email);

    const user = await findUserByEmail(normalized);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.otp || user.otp !== String(otp) || !user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Mark email as verified
    user.otp = null;
    user.otpExpiry = null;
    user.verified = true;
    await user.save();

    const token = issueToken(user, "email");

    return res.status(200).json({
      success: true,
      token,
      data: { user: formatAuthResponse(user) },
    });
  } catch (err) {
    console.error(`[Auth] Verify OTP error for ${req.body.email}:`, err.message);
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
};

// ------------------------------------------------------------
// Setup password
// ------------------------------------------------------------

export const setupPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user?._id || req.user?.id || req.user?.userId;

    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing user or password",
      });
    }
    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.password = password;
    await user.save();

    return res.json({ success: true, message: "Password set successfully" });
  } catch (err) {
    console.error("Setup password error:", err);
    return res.status(500).json({ success: false, message: "Failed to set password" });
  }
};

// ------------------------------------------------------------
// Save role
// ------------------------------------------------------------

export const saveRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user?._id || req.user?.id || req.user?.userId;

    const validRoles = ["founder", "investor", "admin"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role is missing or invalid",
      });
    }
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      data: { user: formatAuthResponse(user) },
    });
  } catch (err) {
    console.error(`[Auth] Save role error for user ${req.user?._id}:`, err.message);
    return res.status(500).json({ success: false, message: "Failed to save role" });
  }
};

// ------------------------------------------------------------
// Login
// ------------------------------------------------------------

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await findUserByEmail(email).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const storedPassword = user.password;
    const looksLikeBcryptHash = /^\$2[aby]\$\d{2}\$.{53}$/.test(storedPassword);
    const isMatch = looksLikeBcryptHash
      ? await bcrypt.compare(password, storedPassword)
      : storedPassword === password;

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.status === "blocked" || user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact support.",
      });
    }

    const token = issueToken(user, "email");

    return res.status(200).json({
      success: true,
      token,
      data: { user: formatAuthResponse(user) },
    });
  } catch (err) {
    console.error(`[Auth] Login error for ${req.body.email}:`, err.message);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

// ------------------------------------------------------------
// Get current user
// ------------------------------------------------------------

export const getMe = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(userId).select(
      "-password -otp -otpExpiry -resetToken -resetTokenExpiry"
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: { user: formatAuthResponse(user) } });
  } catch (err) {
    console.error(`[Auth] Get me error for user ${req.user?._id}:`, err.message);
    return res.status(500).json({ success: false, message: "Failed to load user" });
  }
};

// ------------------------------------------------------------
// Logout
// ------------------------------------------------------------

export const logoutUser = async (_req, res) => {
  try {
    // Clear the cookie if one was ever set.
    res.clearCookie("token", { path: "/" });
    // JWT is stateless; the client discards it. We keep a 200 response
    // so the frontend can complete local cleanup deterministically.
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
};

// ------------------------------------------------------------
// Forgot password — issue reset token + email
// ------------------------------------------------------------

export const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await findUserByEmail(email);
    // Always respond 200 even if the user doesn't exist to avoid
    // leaking which emails are registered.
    if (!user) {
      return res.json({
        success: true,
        message: "If that email is registered, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    const frontend = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetLink = `${frontend}/resetPassword?token=${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your Travest password",
        text: `Reset your password here: ${resetLink}`,
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
      });
    } catch (emailErr) {
      console.error("Reset email failed:", emailErr.message);
    }

    return res.json({
      success: true,
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to request password reset",
    });
  }
};

// ------------------------------------------------------------
// Reset password — consume token + set new password
// ------------------------------------------------------------

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.json({
      success: true,
      data: { message: "Password updated successfully" },
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};

