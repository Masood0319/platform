import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteNotifications,
  deleteAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationById,
  getNotificationsByType,
  markNotificationsByTypeAsRead,
} from "../controllers/notification.controller.js";

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

router.use(protect);

// ============================================
// GET NOTIFICATIONS (User can only see their own)
// ============================================

// GET /api/notifications - Get all my notifications
router.get("/", getNotifications);

// GET /api/notifications/unread - Get unread count
router.get("/unread", getUnreadCount);

// GET /api/notifications/:id - Get single notification
router.get("/:id", getNotificationById);

// GET /api/notifications/type/:type - Get notifications by type
router.get("/type/:type", getNotificationsByType);

// ============================================
// NOTIFICATION ACTIONS
// ============================================

// PUT /api/notifications/read - Mark specific notifications as read
router.put("/read", markAsRead);

// PUT /api/notifications/read-all - Mark all as read
router.put("/read-all", markAllAsRead);

// PUT /api/notifications/read/types - Mark notifications by type as read
router.put("/read/types", markNotificationsByTypeAsRead);

// DELETE /api/notifications - Delete specific notifications
router.delete("/", deleteNotifications);

// DELETE /api/notifications/all - Delete all notifications
router.delete("/all", deleteAllNotifications);

// DELETE /api/notifications/:id - Delete single notification
router.delete("/:id", deleteNotification);

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

// GET /api/notifications/preferences - Get preferences
router.get("/preferences", getNotificationPreferences);

// PUT /api/notifications/preferences - Update preferences
router.put("/preferences", updateNotificationPreferences);

export default router;