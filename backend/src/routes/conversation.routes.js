import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getMyConversations,
  getOrCreateConversation,
  getConversationById,
  deleteConversation,
  getUnreadCount,
  markConversationAsRead,
} from "../controllers/conversation.controller.js";

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

router.use(protect);

// ============================================
// GET CONVERSATIONS (Both roles can view their own)
// ============================================

// GET /api/conversations - Get all my conversations
router.get("/", getMyConversations);

// GET /api/conversations/unread - Get unread count
router.get("/unread", getUnreadCount);

// ============================================
// CONVERSATION MANAGEMENT (Both roles if participant)
// ============================================

// POST /api/conversations - Create or get conversation
// NOTE: Should only be called from deal rooms
router.post("/", getOrCreateConversation);

// GET /api/conversations/:id - Get specific conversation
router.get("/:id", getConversationById);

// DELETE /api/conversations/:id - Delete conversation (own only)
router.delete("/:id", deleteConversation);

// PATCH /api/conversations/:id/read - Mark conversation as read
router.patch("/:id/read", markConversationAsRead);

export default router;