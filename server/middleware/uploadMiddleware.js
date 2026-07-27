const multer = require("multer");
const path = require("path");

const fs = require("fs");

// Ensure temp directory exists
const tempDir = path.join(__dirname, "../uploads/temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Use disk storage to prevent memory overflow on large files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File type validation
const fileFilter = (req, file, cb) => {
  const allowedMime = [
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "application/pdf",
    "audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg",
    "audio/wav", "audio/x-m4a", "video/webm"
  ];
  if (allowedMime.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB Limit
  },
  fileFilter,
});

module.exports = upload;
