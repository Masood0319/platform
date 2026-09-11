import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  submitVerification,
  getVerificationStatus,
  getMyVerifications,
  resubmitVerification,
  cancelVerification,
  getVerificationDocument,
} from "../controllers/verification.controller.js";
import { uploadMultipleDocs, handleUploadError } from "../middleware/upload.middleware.js";

const router = Router();

router.use(protect);

// Submit verification (with file upload)
router.post("/", uploadMultipleDocs, handleUploadError, submitVerification);

// Status & list
router.get("/status", getVerificationStatus);
router.get("/my", getMyVerifications);

// Document view
router.get("/:id/document", getVerificationDocument);

// Resubmit (with new files)
router.put("/:id/resubmit", uploadMultipleDocs, handleUploadError, resubmitVerification);

// Cancel pending
router.delete("/:id/cancel", cancelVerification);

export default router;