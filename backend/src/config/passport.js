import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LinkedInStrategy } from "passport-linkedin-oauth2";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

// ============================================================
// PASSPORT CONFIGURATION — OAuth IDENTITY VERIFICATION ONLY
// ------------------------------------------------------------
// IMPORTANT ARCHITECTURE DECISION:
//   * Passport is used ONLY to verify an OAuth identity.
//   * NO sessions (no serializeUser / deserializeUser).
//   * NO passport.session() in app.js.
//   * JWT is the ONLY authentication mechanism after login.
//
// This eliminates the OAuth redirect-loop + account-switching bug
// caused by stale Passport sessions persisting across logouts.
// ============================================================

// Map provider names to the strategy key passport uses internally.
export const OAUTH_PROVIDERS = {
  google: "google",
  linkedin: "linkedin",
};

/**
 * Generate a random password for OAuth-created users (never used to log in,
 * but satisfies the schema and prevents null-password edge cases).
 */
async function generateOAuthPassword() {
  const randomPassword = `${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}-${Date.now()}`;
  return bcrypt.hash(randomPassword, 10);
}

/**
 * Shared find-or-create logic for OAuth strategies.
 * Returns an existing user or creates a new one from the provider profile.
 */
export async function findOrCreateOAuthUser({ provider, profile }) {
  const email = profile.emails?.[0]?.value?.toLowerCase().trim();
  if (!email) {
    const error = new Error("No email found from OAuth provider");
    error.code = "NO_EMAIL";
    throw error;
  }

  let user = await User.findOne({ email });

  if (user) {
    // Existing user: refresh avatar only if they have none.
    const photo = profile.photos?.[0]?.value || profile._json?.pictureURL || null;
    if (photo && !user.profilePicture) {
      user.profilePicture = photo;
      await user.save();
    }
    return user;
  }

  // New user
  const photo =
    profile.photos?.[0]?.value ||
    profile._json?.pictureURL ||
    profile._json?.picture ||
    null;

  user = await User.create({
    name:
      profile.displayName ||
      profile.name?.givenName ||
      profile._json?.name ||
      "User",
    email,
    password: await generateOAuthPassword(),
    role: "founder",
    status: "active",
    verified: true,
    profilePicture: photo,
  });

  return user;
}

/**
 * Build the passport strategy registration.
 * `configurePassport()` is idempotent-safe.
 */
export const configurePassport = () => {
  // ============================================
  // GOOGLE OAUTH STRATEGY
  // ============================================
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      "google",
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL:
            process.env.GOOGLE_CALLBACK_URL ||
            "http://localhost:5000/api/auth/google/callback",
          passReqToCallback: true,
          // CRITICAL: forces Google to always show the account chooser.
          // Fixes "cannot switch Google accounts after logout" redirect loops.
          prompt: "select_account",
          // Required for switching accounts; must also be enabled in Google Console.
          scope: ["profile", "email", "openid"],
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateOAuthUser({
              provider: "google",
              profile,
            });
            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  }

  // ============================================
  // LINKEDIN OAUTH STRATEGY
  // ============================================
  if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
    passport.use(
      "linkedin",
      new LinkedInStrategy(
        {
          clientID: process.env.LINKEDIN_CLIENT_ID,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
          callbackURL:
            process.env.LINKEDIN_CALLBACK_URL ||
            "http://localhost:5000/api/auth/linkedin/callback",
          scope: ["r_emailaddress", "r_liteprofile", "openid"],
          passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const user = await findOrCreateOAuthUser({
              provider: "linkedin",
              profile,
            });
            return done(null, user);
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  }
};

export default passport;

