import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File filter
// FIX: added image/webp — the frontend's logo/cover uploader already
// advertises webp support (`accept="image/png,image/jpeg,image/webp"`),
// but the server was silently rejecting it.
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
    'application/pdf', 'image/heic'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, PDF, and HEIC are allowed.'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit — keep in sync with frontend FileUpload's maxSizeMb
  },
  fileFilter: fileFilter,
});

// Upload middleware for verification documents
export const uploadVerificationDocs = upload.array('documents', 5);

// Upload middleware for single document
export const uploadSingleDoc = upload.single('document');

// Error handler for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // FIX: multer's actual overflow error code is 'LIMIT_FILE_SIZE', not
    // 'FILE_TOO_LARGE'. The friendly message below was previously dead code.
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Max size is 5MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed.',
    });
  }
  next(err);
};