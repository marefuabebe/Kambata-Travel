const { uploadImage } = require("../utils/cloudinary");
const logger = require("../utils/logger");
const fs = require("fs");

// @desc    Upload an image to Cloudinary
// @route   POST /api/upload/image
// @access  Private
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    // Upload to Cloudinary using the local path from multer
    const result = await uploadImage(req.file.path, "guide-profiles");

    // Clean up local file after upload
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      url: result.url,
      public_id: result.public_id,
      resource_type: result.resource_type
    });
  } catch (error) {
    logger.error(`Upload Error: ${error.message}`);
    // Clean up if something went wrong
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

module.exports = {
  uploadFile
};
