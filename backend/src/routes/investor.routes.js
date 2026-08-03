import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getAllInvestors,
  getInvestorProfile,
  getMyPortfolio,
  getInvestorStats,
  updateInvestorProfile,
  getMyDeals,
  getInvestorDashboard,
} from "../controllers/investor.controller.js";

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

router.use(protect);

// ============================================
// PUBLIC (Within Platform) ROUTES
// ============================================

// GET /api/investors - List all investors (limited info)
router.get("/", getAllInvestors);

// GET /api/investors/:id - Get investor profile (limited info)
router.get("/:id", getInvestorProfile);

// ============================================
// INVESTOR-ONLY ROUTES
// ============================================

// GET /api/investors/me/portfolio - Investor's portfolio
router.get("/me/portfolio", restrictTo("investor"), getMyPortfolio);

// GET /api/investors/me/stats - Investor's statistics
router.get("/me/stats", restrictTo("investor"), getInvestorStats);

// GET /api/investors/me/deals - Investor's deals
router.get("/me/deals", restrictTo("investor"), getMyDeals);

// GET /api/investors/me/dashboard - Investor dashboard data
router.get("/me/dashboard", restrictTo("investor"), getInvestorDashboard);

// PUT /api/investors/me/profile - Update investor profile
router.put("/me/profile", restrictTo("investor"), updateInvestorProfile);

export default router;