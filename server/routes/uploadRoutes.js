const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { uploadFile } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");

// Configure Multer for temporary local storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|pdf|mp3|wav|ogg|webm|m4a/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Images, PDFs, and Audio files only!");
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

router.post("/image", protect, upload.single("image"), uploadFile);
router.post("/document", protect, upload.single("document"), uploadFile);

module.exports = router;
