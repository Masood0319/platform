import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { uploadSingleDoc, handleUploadError } from "../middleware/upload.middleware.js";
import {
  getAllStartups,
  getMyStartups,
  getStartupById,
  createStartup,
  updateStartup,
  deleteStartup,
  publishStartup,
  getStartupStats,
  getStartupMeta,
  getStartupBySlug,
  uploadPitchDeck,
  uploadStartupImage,
} from "../controllers/startup.controller.js";

const router = Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// GET /api/startups - Public listing with filters
router.get("/", getAllStartups);

// GET /api/startups/stats - Public stats (optional)
router.get("/stats", getStartupStats);

// GET /api/startups/meta - Canonical enum/label pairs (sector, stage,
// country, currency, traction). Single source of truth so frontend
// selectors can never drift from what the backend actually accepts.
router.get("/meta", getStartupMeta);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

router.use(protect);

// ============================================
// FOUNDER-ONLY ROUTES
// ============================================

// GET /api/startups/mine - Get founder's own startups
router.get("/mine", restrictTo("founder"), getMyStartups);

// POST /api/startups - Create a new startup (founder only)
router.post("/", restrictTo("founder"), createStartup);

// PUT /api/startups/:id - Update startup (founder only)
router.put("/:id", restrictTo("founder"), updateStartup);

// DELETE /api/startups/:id - Delete startup (founder only)
router.delete("/:id", restrictTo("founder"), deleteStartup);

// PATCH /api/startups/:id/publish - Publish/unpublish (founder only)
router.patch("/:id/publish", restrictTo("founder"), publishStartup);

// POST /api/startups/:id/pitch-deck - Upload pitch deck (founder only)
// FIX: multer middleware was missing — req.file was always undefined.
router.post(
  "/:id/pitch-deck",
  restrictTo("founder"),
  uploadSingleDoc,
  handleUploadError,
  uploadPitchDeck
);

// POST /api/startups/:id/image - Upload startup image (founder only)
// FIX: multer middleware was missing — req.file was always undefined.
router.post(
  "/:id/image",
  restrictTo("founder"),
  uploadSingleDoc,
  handleUploadError,
  uploadStartupImage
);

// ============================================
// ROUTES ACCESSIBLE TO BOTH ROLES (with restrictions)
// ============================================

// GET /api/startups/slug/:slug - View startup by slug (any authenticated user)
router.get("/slug/:slug", getStartupBySlug);

// GET /api/startups/:id - View startup detail (any authenticated user)
router.get("/:id", getStartupById);

export default router;