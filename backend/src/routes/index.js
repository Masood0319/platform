import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

// Import all route files
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import startupRoutes from "./startup.routes.js";
import investorRoutes from "./investor.routes.js";
import interestRoutes from "./interest.routes.js";
import matchRoutes from "./match.routes.js";
import dealRoomRoutes from "./dealRoom.routes.js";
import conversationRoutes from "./conversation.routes.js";
import messageRoutes from "./message.routes.js";
import notificationRoutes from "./notification.routes.js";
import verificationRoutes from "./verification.routes.js";
import adminRoutes from "./admin.routes.js";
import founderRoutes from "./founder.routes.js";

const router = Router();

// ============================================
// API VERSION
// ============================================

const API_VERSION = "/api";

// ============================================
// PUBLIC ROUTES (No authentication)
// ============================================

router.use(`${API_VERSION}/auth`, authRoutes);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// User routes - authenticated users can access their own profile
router.use(`${API_VERSION}/users`, protect, userRoutes);

// Startup routes - mixed (public + protected)
router.use(`${API_VERSION}/startups`, startupRoutes);

// Investor routes - mixed (public + protected)
router.use(`${API_VERSION}/investors`, investorRoutes);

// Interest routes - all protected
router.use(`${API_VERSION}/interests`, protect, interestRoutes);

// Match routes - all protected
router.use(`${API_VERSION}/matches`, protect, matchRoutes);

// Deal Room routes - all protected
router.use(`${API_VERSION}/deal-rooms`, protect, dealRoomRoutes);

// Conversation routes - all protected
router.use(`${API_VERSION}/conversations`, protect, conversationRoutes);

// Message routes - all protected
router.use(`${API_VERSION}/messages`, protect, messageRoutes);

// Notification routes - all protected
router.use(`${API_VERSION}/notifications`, protect, notificationRoutes);

// Verification routes - all protected
router.use(`${API_VERSION}/verification`, protect, verificationRoutes);

// ============================================
// ROLE-SPECIFIC ROUTES
// ============================================

// Founder routes - founder only
router.use(`${API_VERSION}/founder`, protect, restrictTo("founder"), founderRoutes);

// Admin routes - admin only
router.use(`${API_VERSION}/admin`, protect, restrictTo("admin"), adminRoutes);

// ============================================
// HEALTH CHECK (Public)
// ============================================

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================
// 404 HANDLER
// ============================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

export default router;