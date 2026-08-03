import User from "../../models/user.model.js";
import { verifyRequestToken } from "./authUtils.js";

// ============================================================
// getUserFromRequest
// ------------------------------------------------------------
// Thin, reusable wrapper: verify JWT -> load user document.
// Used by middleware and controllers that need the current user.
// ============================================================

/**
 * Load the authenticated user for an Express request.
 *
 * @param {import("express").Request} req
 * @returns {Promise<object|null>} Mongoose user document (password/otp/tokens stripped)
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

export default getUserFromRequest;

