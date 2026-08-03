import express from "express";
import cors from "cors";
import passport from "./config/passport.js";
import { configurePassport } from "./config/passport.js";
import routes from "./routes/index.js";

// ============================================
// SECURITY & PERFORMANCE PACKAGES
// ============================================
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
// import mongoSanitize from "express-mongo-sanitize"; // REMOVED - incompatible with Node 22
// import xss from "xss-clean"; // REMOVED - incompatible with Node 22
import hpp from "hpp";

// ============================================
// MULTER ERROR HANDLER
// ============================================
import { handleUploadError } from "./middleware/upload.middleware.js";

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet - Security headers (includes XSS protection)
app.use(helmet());

// Rate Limiting - Prevent DDOS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Compression - Reduce response size
app.use(compression());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// ============================================
// CORS CONFIGURATION
// ============================================

const defaultOrigins = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"];
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const origins = allowedOrigins.length ? allowedOrigins : defaultOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  })
);

// ============================================
// BODY PARSERS
// ============================================

// Increase limit for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// PASSPORT (OAuth identity verification ONLY)
// ------------------------------------------------------------
// NO express-session and NO passport.session().
// JWT is the ONLY authentication mechanism.
// ============================================

configurePassport();
app.use(passport.initialize());

// ============================================
// MOUNT ALL ROUTES
// ============================================

app.use("/", routes);

// ============================================
// MULTER ERROR HANDLER (Must be after routes)
// ============================================

app.use(handleUploadError);

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  
  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate entry detected",
    });
  }

  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Max size is 5MB.',
    });
  }

  if (err.message && err.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;