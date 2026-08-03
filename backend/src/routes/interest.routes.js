import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  createInterest,
  getReceivedInterests,
  getSentInterests,
  getInterestById,
  acceptInterest,
  declineInterest,
  cancelInterest,
  getInterestStats,
} from "../controllers/interest.controller.js";

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

router.use(protect);

// ============================================
// CREATE INTEREST (Both roles can create)
// ============================================

// POST /api/interests - Create an interest
// - Founder → Investor (must provide investorId)
// - Investor → Startup/Founder (must provide startupId)
router.post("/", createInterest);

// ============================================
// GET INTERESTS (Both roles can view their own)
// ============================================

// GET /api/interests/received - Get all received interests
router.get("/received", getReceivedInterests);

// GET /api/interests/sent - Get all sent interests
router.get("/sent", getSentInterests);

// GET /api/interests/stats - Get interest statistics
router.get("/stats", getInterestStats);

// ============================================
// INTEREST DETAIL (Both roles if participant)
// ============================================

// GET /api/interests/:id - Get specific interest
router.get("/:id", getInterestById);

// ============================================
// INTEREST ACTIONS (Receiver or Sender only)
// ============================================

// PATCH /api/interests/:id/accept - Accept interest (receiver only)
router.patch("/:id/accept", acceptInterest);

// PATCH /api/interests/:id/decline - Decline interest (receiver only)
router.patch("/:id/decline", declineInterest);

// DELETE /api/interests/:id - Cancel interest (sender only)
router.delete("/:id", cancelInterest);

export default router;