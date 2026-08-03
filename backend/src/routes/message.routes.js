import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  deleteMessage,
  shareEmail,
  getConversationParticipants,
} from "../controllers/message.controller.js";

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

router.use(protect);

// ============================================
// MESSAGE ROUTES (Both roles if participant)
// ============================================

// GET /api/messages/unread-count - Get total unread count
router.get("/unread-count", getUnreadCount);

// GET /api/messages/:conversationId - Get messages for a conversation
router.get("/:conversationId", getMessages);

// POST /api/messages - Send a message
router.post("/", sendMessage);

// DELETE /api/messages/:id - Delete a message (own only)
router.delete("/:id", deleteMessage);

// PUT /api/messages/read - Mark messages as read
router.put("/read", markMessagesAsRead);

// POST /api/messages/:conversationId/share-email - Share email (after 5 messages)
router.post("/:conversationId/share-email", shareEmail);

// GET /api/messages/:conversationId/participants - Get conversation participants
router.get("/:conversationId/participants", getConversationParticipants);

export default router;