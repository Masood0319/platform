import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getDashboard,
  getMyStartups,
  getStartupStats,
  getDealStats,
  getFounderProfile,
  updateFounderProfile,
  getStartupInsights,
} from "../controllers/founder.controller.js";

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION AND FOUNDER ROLE
// ============================================

router.use(protect);
router.use(restrictTo("founder"));

// ============================================
// DASHBOARD
// ============================================

// GET /api/founder/dashboard - Main dashboard
router.get("/dashboard", getDashboard);

// ============================================
// PROFILE
// ============================================

// GET /api/founder/profile - Get founder profile
router.get("/profile", getFounderProfile);

// PUT /api/founder/profile - Update founder profile
router.put("/profile", updateFounderProfile);

// ============================================
// STARTUPS
// ============================================

// GET /api/founder/startups - Get all my startups
router.get("/startups", getMyStartups);

// GET /api/founder/startups/stats - Startup statistics
router.get("/startups/stats", getStartupStats);

// GET /api/founder/startups/:id/insights - Startup insights
router.get("/startups/:id/insights", getStartupInsights);

// ============================================
// DEALS
// ============================================

// GET /api/founder/deals/stats - Deal statistics
router.get("/deals/stats", getDealStats);

export default router;