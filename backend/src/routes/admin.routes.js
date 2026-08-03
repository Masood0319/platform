import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  // Dashboard
  getDashboardStats,
  getPlatformAnalytics,
  
  // User Management
  getAllUsers,
  getUserById as adminGetUserById,
  approveUser,
  blockUser,
  deleteUser as adminDeleteUser,
  updateUserRole,
  
  // Startup Management
  getAllStartups as adminGetAllStartups,
  approveStartup,
  featureStartup,
  deleteStartup as adminDeleteStartup,
  
  // Deal Management
  getAllDeals,
  getDealById as adminGetDealById,
  forceCloseDeal,
  resolveDispute,
  
  // Verification
  getVerificationRequests,
  approveVerification,
  rejectVerification,
  
  // Revenue
  getRevenueStats,
  getPayouts,
  markPayoutAsPaid,
  
  // Platform Settings
  getPlatformSettings,
  updatePlatformSettings,
  
  // Analytics
  getUserAnalytics,
  getDealAnalytics,
} from "../controllers/admin.controller.js";

const router = Router();

// ============================================
// ALL ADMIN ROUTES REQUIRE:
// 1. Authentication
// 2. Admin role
// ============================================

router.use(protect);
router.use(restrictTo("admin"));

// ============================================
// DASHBOARD
// ============================================

// GET /api/admin/dashboard - Admin dashboard stats
router.get("/dashboard", getDashboardStats);

// GET /api/admin/analytics - Platform analytics
router.get("/analytics", getPlatformAnalytics);

// ============================================
// USER MANAGEMENT
// ============================================

// GET /api/admin/users - Get all users
router.get("/users", getAllUsers);

// GET /api/admin/users/:id - Get specific user
router.get("/users/:id", adminGetUserById);

// PATCH /api/admin/users/:id/approve - Approve user
router.patch("/users/:id/approve", approveUser);

// PATCH /api/admin/users/:id/block - Block user
router.patch("/users/:id/block", blockUser);

// PATCH /api/admin/users/:id/role - Update user role
router.patch("/users/:id/role", updateUserRole);

// DELETE /api/admin/users/:id - Delete user
router.delete("/users/:id", adminDeleteUser);

// ============================================
// STARTUP MANAGEMENT
// ============================================

// GET /api/admin/startups - Get all startups
router.get("/startups", adminGetAllStartups);

// PATCH /api/admin/startups/:id/approve - Approve startup
router.patch("/startups/:id/approve", approveStartup);

// PATCH /api/admin/startups/:id/feature - Feature startup
router.patch("/startups/:id/feature", featureStartup);

// DELETE /api/admin/startups/:id - Delete startup
router.delete("/startups/:id", adminDeleteStartup);

// ============================================
// DEAL MANAGEMENT
// ============================================

// GET /api/admin/deals - Get all deals
router.get("/deals", getAllDeals);

// GET /api/admin/deals/:id - Get specific deal
router.get("/deals/:id", adminGetDealById);

// POST /api/admin/deals/:id/force-close - Force close deal
router.post("/deals/:id/force-close", forceCloseDeal);

// POST /api/admin/deals/:id/resolve - Resolve dispute
router.post("/deals/:id/resolve", resolveDispute);

// ============================================
// VERIFICATION MANAGEMENT
// ============================================

// GET /api/admin/verifications - Get all verification requests
router.get("/verifications", getVerificationRequests);

// PATCH /api/admin/verifications/:id/approve - Approve verification
router.patch("/verifications/:id/approve", approveVerification);

// PATCH /api/admin/verifications/:id/reject - Reject verification
router.patch("/verifications/:id/reject", rejectVerification);

// ============================================
// REVENUE & PAYOUTS
// ============================================

// GET /api/admin/revenue - Get revenue stats
router.get("/revenue", getRevenueStats);

// GET /api/admin/payouts - Get all payouts
router.get("/payouts", getPayouts);

// PATCH /api/admin/payouts/:id/mark-paid - Mark payout as paid
router.patch("/payouts/:id/mark-paid", markPayoutAsPaid);

// ============================================
// PLATFORM SETTINGS
// ============================================

// GET /api/admin/settings - Get platform settings
router.get("/settings", getPlatformSettings);

// PUT /api/admin/settings - Update platform settings
router.put("/settings", updatePlatformSettings);

// ============================================
// ANALYTICS
// ============================================

// GET /api/admin/analytics/users - User analytics
router.get("/analytics/users", getUserAnalytics);

// GET /api/admin/analytics/deals - Deal analytics
router.get("/analytics/deals", getDealAnalytics);

export default router;