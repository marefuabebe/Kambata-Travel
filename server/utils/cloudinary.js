const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config({ path: require("path").join(__dirname, "../.env") });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image/document from disk to Cloudinary with auto-compression
 * @param {String} localPath - Local file path from multer diskStorage
 * @param {String} folder - Cloudinary folder (e.g., 'kambata-travel/profiles')
 */
const uploadImage = async (localPath, folder = "kambata-travel", options = {}) => {
  try {
    const isPdf = localPath.toLowerCase().endsWith(".pdf");
    const isRaw = isPdf || options.resource_type === "raw";
    
    const uploadOptions = {
      folder,
      use_filename: true,
      unique_filename: true,
      resource_type: isRaw ? "raw" : (options.resource_type || "auto"),
      ...options
    };

    // Only apply image compression if it's not a raw file or PDF
    if (!isRaw && !uploadOptions.resource_type.includes("raw")) {
      uploadOptions.transformation = [
        { quality: "auto", fetch_format: "auto" }
      ];
    }

    const result = await cloudinary.uploader.upload(localPath, uploadOptions);
    return {
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type,
    };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 */
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
};
