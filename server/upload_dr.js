require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function run() {
  const filePath = 'C:/Users/abebe/.gemini/antigravity-ide/brain/813a1f0d-5c1b-4ac7-b07c-efa171eddce7/dr_nuriye_bg_1782044768086.png';

  if (fs.existsSync(filePath)) {
    try {
      const res = await cloudinary.uploader.upload(filePath, { folder: 'kambata' });
      console.log(`URL for Dr Nuriye: ${res.secure_url}`);
    } catch (err) {
      console.error(`Failed to upload:`, err);
    }
  } else {
    console.error(`File not found: ${filePath}`);
  }
}

run();
