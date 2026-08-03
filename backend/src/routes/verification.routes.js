import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  submitVerification,
  getVerificationStatus,
  getMyVerifications,
  resubmitVerification,
  cancelVerification,
  getVerificationDocument,
} from "../controllers/verification.controller.js";

const router = Router();

// ============================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================

router.use(protect);

// ============================================
// VERIFICATION SUBMISSION (Both roles can submit)
// ============================================

// POST /api/verification - Submit verification request
router.post("/", submitVerification);

// GET /api/verification/status - Get my verification status
router.get("/status", getVerificationStatus);

// GET /api/verification/my - Get all my verification requests
router.get("/my", getMyVerifications);

// GET /api/verification/:id/document - Get verification document
router.get("/:id/document", getVerificationDocument);

// PUT /api/verification/:id/resubmit - Resubmit verification
router.put("/:id/resubmit", resubmitVerification);

// DELETE /api/verification/:id/cancel - Cancel verification request
router.delete("/:id/cancel", cancelVerification);

export default router;