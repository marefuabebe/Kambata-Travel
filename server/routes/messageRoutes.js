const express = require("express");
const router = express.Router();
const {
  getRooms,
  getRoomMessages,
  createDirectRoom,
  getUnreadCount,
  editMessage,
  deleteMessage,
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { uploadImage } = require("../utils/cloudinary");
const fs = require("fs");
const axios = require("axios");

router.use(protect);

// Chat media upload (image / PDF / voice)
router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No file provided");
    }
    const result = await uploadImage(req.file.path, "kambata-travel/chat");
    fs.unlinkSync(req.file.path);

    // Detect file type category
    let fileType = "file";
    if (req.file.mimetype.startsWith("image/")) fileType = "image";
    else if (req.file.mimetype === "application/pdf") fileType = "pdf";
    else if (req.file.mimetype.startsWith("audio/") || req.file.mimetype === "video/webm") fileType = "audio";

    res.json({
      success: true,
      url: result.url,
      public_id: result.public_id,
      resource_type: result.resource_type,
      fileType,
      fileName: req.file.originalname,
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
});

// Proxy download to bypass CORS and Cloudinary strict transformations
router.get("/download", async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ success: false, message: "URL is required" });
    
    // Log environment variables (masked)
    console.log("--- DOWNLOAD PROXY DEBUG ---");
    console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("API Key:", process.env.CLOUDINARY_API_KEY ? "***" : "missing");
    console.log("API Secret:", process.env.CLOUDINARY_API_SECRET ? "***" : "missing");

    const isRaw = url.includes("/raw/upload/");
    const isImage = url.includes("/image/upload/");
    const isVideo = url.includes("/video/upload/");
    console.log("Asset Type:", { isRaw, isImage, isVideo });
    console.log("Exact URL being requested:", url);

    const axiosConfig = {
      method: "GET",
      url,
      responseType: "stream"
    };
    console.log("Axios Request Config:", axiosConfig);

    const response = await axios(axiosConfig);
    
    const filename = url.split('/').pop() || "download";
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", response.headers["content-type"] || "application/octet-stream");
    
    response.data.pipe(res);
  } catch (error) {
    console.error("--- DOWNLOAD PROXY ERROR ---");
    if (error.response) {
      console.error("Error Status:", error.response.status);
      console.error("Error Headers:", error.response.headers);
      
      if (error.response.data && typeof error.response.data.on === 'function') {
        let errorData = "";
        error.response.data.on('data', chunk => { errorData += chunk; });
        error.response.data.on('end', () => {
          console.error("Cloudinary Error Data (stream):", errorData);
        });
      } else {
        console.error("Cloudinary Error Data:", error.response.data);
      }
    } else {
      console.error("Error Message:", error.message);
    }
    res.status(error.response?.status || 500).json({ 
      success: false, 
      message: "Failed to download file",
      cloudinaryStatus: error.response?.status
    });
  }
});

router.route("/rooms").get(getRooms);
router.route("/unread-count").get(getUnreadCount);
router.route("/rooms/:roomId").get(getRoomMessages);
router.route("/direct").post(createDirectRoom);
router.route("/:messageId").patch(editMessage).delete(deleteMessage);

module.exports = router;
