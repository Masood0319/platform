import { signAuthToken } from "../lib/auth/jwt.js";

// ============================================================
// generateToken
// ------------------------------------------------------------
// Kept for backward compatibility with any legacy callers.
// Delegates to the shared signAuthToken helper (single source).
// ============================================================

/**
 * Generate an auth JWT for a user document.
 *
 * @param {object} user - User document (needs _id, email, role)
 * @param {object} [options] - Optional sign options (e.g. { provider })
 * @returns {string} Signed JWT
 */
export const generateToken = (user, options = {}) => {
  return signAuthToken(user, options);
};

export default generateToken;

