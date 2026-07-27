require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function run() {
  const filePath = 'C:/Users/abebe/.gemini/antigravity-ide/brain/813a1f0d-5c1b-4ac7-b07c-efa171eddce7/media__1782045581742.jpg';

  if (fs.existsSync(filePath)) {
    try {
      const res = await cloudinary.uploader.upload(filePath, { folder: 'kambata' });
      console.log(`URL for Woma: ${res.secure_url}`);
    } catch (err) {
      console.error(`Failed to upload:`, err);
    }
  } else {
    console.error(`File not found: ${filePath}`);
  }
}

run();
