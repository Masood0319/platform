// ============================================================
// AUTH UTILITIES (Express-compatible)
// ------------------------------------------------------------
// Shared helpers for extracting and verifying JWT tokens from
// Express requests. No Next.js shims. No Passport sessions.
// ============================================================

import { verifyAuthToken } from "./jwt.js";
import User from "../../models/user.model.js";

/**
 * Read the bearer token from an Express request.
 * Checks Authorization header first, then cookie fallback.
 *
 * @param {import("express").Request} req
 * @returns {string|null}
 */
export function extractTokenFromRequest(req) {
  if (!req?.headers) return null;

  // 1. Authorization: Bearer <token>
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim() || null;
  }

  // 2. Cookie fallback (token=...)
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
    if (match) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }

  return null;
}

/**
 * Verify the token attached to a request.
 * Returns the normalized payload or null if missing/invalid.
 *
 * @param {import("express").Request} req
 * @returns {object|null} { userId, role, email, exp, iat, provider? }
 */
export function verifyRequestToken(req) {
  const token = extractTokenFromRequest(req);
  if (!token) return null;
  try {
    return verifyAuthToken(token);
  } catch {
    return null;
  }
}

/**
 * Load the user document from a verified token payload.
 * Returns null when the token is invalid or the user is gone.
 *
 * @param {import("express").Request} req
 * @returns {Promise<object|null>} Mongoose user document (password stripped)
 */
export async function getUserFromRequest(req) {
  const payload = verifyRequestToken(req);
  if (!payload?.userId) return null;

  try {
    const user = await User.findById(payload.userId).select(
      "-password -otp -otpExpiry -resetToken -resetTokenExpiry"
    );
    return user || null;
  } catch {
    return null;
  }
}

