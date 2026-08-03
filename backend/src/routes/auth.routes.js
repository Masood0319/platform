import express from "express";
import rateLimit from "express-rate-limit";
import passport from "../config/passport.js";
import { signAuthToken } from "../lib/auth/jwt.js";
import { protect } from "../middleware/auth.middleware.js";
import {
  signup,
  verifyOTP,
  setupPassword,
  saveRole,
  login,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

// ============================================================
// AUTH ROUTES
// ------------------------------------------------------------
// Passport is used ONLY for OAuth identity verification.
// Sessions are disabled — JWT is the only authentication state.
// ============================================================

// ------------------------------------------------------------
// Public auth endpoints
// ------------------------------------------------------------

router.post("/signup", signup);
router.post("/verify", verifyOTP);
router.post("/login", login);
router.post("/logout", logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ------------------------------------------------------------
// Protected endpoints
// ------------------------------------------------------------

router.get("/me", protect, getMe);
router.post("/setup", protect, setupPassword);
router.post("/role", protect, saveRole);

// ============================================================
// OAUTH HELPERS
// ============================================================

const FRONTEND_URL = () => process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Build a Passport OAuth callback handler that:
 *  1. Verifies the OAuth identity (Passport)
 *  2. Issues a JWT
 *  3. Redirects to /oauth/callback?token=... (frontend consumes it)
 * No sessions involved. The token is delivered via query param.
 */
const oauthCallbackHandler = (providerName) => {
  return (req, res, next) => {
    passport.authenticate(providerName, { session: false }, (err, user) => {
      if (err) {
        console.error(`❌ ${providerName} callback error:`, err.message);
        return res.redirect(
          `${FRONTEND_URL()}/oauth/callback?error=oauth_failed`
        );
      }

      if (!user) {
        return res.redirect(
          `${FRONTEND_URL()}/oauth/callback?error=user_not_found`
        );
      }

      try {
        const token = signAuthToken(user, { provider: providerName });
        return res.redirect(
          `${FRONTEND_URL()}/oauth/callback?token=${encodeURIComponent(token)}`
        );
      } catch (error) {
        console.error(`❌ ${providerName} token error:`, error.message);
        return res.redirect(
          `${FRONTEND_URL()}/oauth/callback?error=token_error`
        );
      }
    })(req, res, next);
  };
};

/**
 * Guard: only register OAuth routes when credentials are configured.
 */
const hasProviderCredentials = (provider) => {
  if (provider === "google") {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }
  if (provider === "linkedin") {
    return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
  }
  return false;
};

// ============================================================
// GOOGLE OAUTH
// ============================================================

if (hasProviderCredentials("google")) {
  router.get(
    "/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      // Force Google to show the account chooser each time so users can
      // switch accounts after logout without redirect loops.
      prompt: "select_account",
    })
  );

  router.get("/google/callback", oauthCallbackHandler("google"));
} else {
  console.warn("⚠️ Google OAuth routes disabled - missing credentials");
}

// ============================================================
// LINKEDIN OAUTH
// ============================================================

if (hasProviderCredentials("linkedin")) {
  router.get(
    "/linkedin",
    passport.authenticate("linkedin", {
      scope: ["r_emailaddress", "r_liteprofile"],
      session: false,
    })
  );

  router.get("/linkedin/callback", oauthCallbackHandler("linkedin"));
} else {
  console.warn("⚠️ LinkedIn OAuth routes disabled - missing credentials");
}

// ============================================================
// OAUTH FAILURE REDIRECT (fallback)
// ============================================================

router.get("/oauth/failure", (_req, res) => {
  res.redirect(`${FRONTEND_URL()}/oauth/callback?error=oauth_failed`);
});

export default router;

