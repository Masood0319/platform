import jwt from "jsonwebtoken";

// ============================================================
// JWT HELPERS
// ------------------------------------------------------------
// The single source of truth for signing + verifying JWTs.
// Passport is used ONLY for OAuth identity verification.
// JWT is the ONLY authentication mechanism.
// ============================================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

// DB role -> token role (token uses uppercase roles for legacy compatibility)
const DB_TO_TOKEN_ROLE = {
  founder: "FOUNDER",
  investor: "INVESTOR",
  fund_manager: "FUND_MANAGER",
  startup: "FOUNDER",
  admin: "ADMIN",
};

const TOKEN_TO_DB_ROLE = {
  FOUNDER: "founder",
  INVESTOR: "investor",
  FUND_MANAGER: "fund_manager",
  ADMIN: "admin",
};

const DEFAULT_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Normalize a DB role into the uppercase token role.
 */
export function toTokenRole(dbRole) {
  const mapped = DB_TO_TOKEN_ROLE[String(dbRole || "").toLowerCase()];
  if (!mapped) {
    throw new Error("Unsupported user role");
  }
  return mapped;
}

/**
 * Normalize a token role into the lowercase DB role.
 */
export function toDbRole(tokenRole) {
  const mapped = TOKEN_TO_DB_ROLE[String(tokenRole || "").toUpperCase()];
  if (!mapped) {
    throw new Error("Unsupported token role");
  }
  return mapped;
}

/**
 * Sign an auth token for a user document.
 *
 * @param {object} user - User document (must have _id, email, role)
 * @param {object} [options]
 * @param {string} [options.expiresIn] - JWT expiry string (default "7d")
 * @param {string} [options.provider] - "google" | "linkedin" | "email" (optional)
 */
export function signAuthToken(user, options = {}) {
  if (!user?._id || !user?.email || !user?.role) {
    throw new Error("Cannot sign token without _id, email, and role");
  }

  const payload = {
    userId: user._id.toString(),
    role: toTokenRole(user.role),
    email: String(user.email).toLowerCase(),
  };

  // Optional provider claim used for OAuth flows (not required for verification)
  if (options.provider) {
    payload.provider = options.provider;
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: options.expiresIn || DEFAULT_TOKEN_TTL_SECONDS,
  });
}

/**
 * Verify + decode an auth token.
 *
 * Returns a normalized payload: { userId, role, email, exp, iat, provider? }
 * Throws on invalid/expired tokens.
 */
export function verifyAuthToken(token) {
  const payload = jwt.verify(token, JWT_SECRET);

  const userId = payload?.userId || payload?.id || payload?._id;
  const role = payload?.role;
  const email = payload?.email;

  if (!userId || !email) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: String(userId),
    role: role ? String(role) : null,
    email: String(email).toLowerCase(),
    provider: payload?.provider || null,
    exp: payload.exp,
    iat: payload.iat,
  };
}

/**
 * Decode a token WITHOUT verifying it. Safe helper for reading
 * expiry / claims on the client-side of the backend if needed.
 * Never use this for authorization.
 */
export function decodeAuthToken(token) {
  return jwt.decode(token);
}

