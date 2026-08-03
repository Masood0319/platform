import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getMyDealRooms,
  getDealRoomById,
  patchDealRoomStatus,
  getDealRoomDocuments,
  uploadDocument,
  deleteDocument,
  getDealRoomActivity,
  closeDeal,
  getDealRoomStats,
} from "../controllers/dealRoom.controller.js";

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

router.use(protect);

// ============================================
// GET DEAL ROOMS (Both roles can view their own)
// ============================================

// GET /api/deal-rooms - Get all my deal rooms
router.get("/", getMyDealRooms);

// GET /api/deal-rooms/stats - Get deal room statistics
router.get("/stats", getDealRoomStats);

// ============================================
// DEAL ROOM DETAIL (Both roles if participant)
// ============================================

// GET /api/deal-rooms/:id - Get specific deal room
router.get("/:id", getDealRoomById);

// GET /api/deal-rooms/:id/activity - Get activity log
router.get("/:id/activity", getDealRoomActivity);

// ============================================
// DEAL ROOM ACTIONS (Both roles if participant)
// ============================================

// PATCH /api/deal-rooms/:id/status - Update deal status
router.patch("/:id/status", patchDealRoomStatus);

// POST /api/deal-rooms/:id/close - Close deal (success fee triggered)
router.post("/:id/close", closeDeal);

// ============================================
// DOCUMENT MANAGEMENT (Both roles if participant)
// ============================================

// GET /api/deal-rooms/:id/documents - Get all documents
router.get("/:id/documents", getDealRoomDocuments);

// POST /api/deal-rooms/:id/documents - Upload document
router.post("/:id/documents", uploadDocument);

// DELETE /api/deal-rooms/:id/documents/:docId - Delete document
router.delete("/:id/documents/:docId", deleteDocument);

export default router;