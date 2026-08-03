import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getInvestors,
  getFounders,
  updateProfile,
  getProfile,
  changePassword,
  deleteAccount,
  getUserById,
  getPublicProfile,
  uploadProfilePicture,
  getAccountStatus,
} from "../controllers/user.controller.js";

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

router.use(protect);

// ============================================
// PUBLIC (Within Platform) ROUTES
// ============================================

// GET /api/users/investors - Get all investors (limited info)
router.get("/investors", getInvestors);

// GET /api/users/founders - Get all founders (limited info)
router.get("/founders", getFounders);

// GET /api/users/public/:id - Get public profile (limited info)
router.get("/public/:id", getPublicProfile);

// ============================================
// PROFILE MANAGEMENT (User's own profile)
// ============================================

// GET /api/users/profile - Get own profile
router.get("/profile", getProfile);

// PUT /api/users/profile - Update own profile
router.put("/profile", updateProfile);

// POST /api/users/profile/picture - Upload profile picture
router.post("/profile/picture", uploadProfilePicture);

// PATCH /api/users/password - Change password
router.patch("/password", changePassword);

// GET /api/users/status - Get account status
router.get("/status", getAccountStatus);

// DELETE /api/users/account - Delete account (with confirmation)
router.delete("/account", deleteAccount);

// ============================================
// USER LOOKUP (Both roles, only if you have a match/deal)
// ============================================

// GET /api/users/:id - Get user by ID (restricted visibility)
router.get("/:id", getUserById);

export default router;