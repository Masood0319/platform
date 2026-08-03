import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getMyMatches,
  getMatchById,
  getMatchStats,
  updateMatchStatus,
  getMatchByDealRoom,
} from "../controllers/match.controller.js";

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

router.use(protect);

// ============================================
// GET MATCHES (Both roles can view their own)
// ============================================

// GET /api/matches - Get all my matches
router.get("/", getMyMatches);

// GET /api/matches/stats - Get match statistics
router.get("/stats", getMatchStats);

// ============================================
// MATCH DETAIL (Both roles if participant)
// ============================================

// GET /api/matches/:id - Get specific match
router.get("/:id", getMatchById);

// GET /api/matches/deal-room/:dealRoomId - Get match by deal room ID
router.get("/deal-room/:dealRoomId", getMatchByDealRoom);

// ============================================
// UPDATE MATCH (Both roles if participant)
// ============================================

// PATCH /api/matches/:id/status - Update match status
router.patch("/:id/status", updateMatchStatus);

export default router;