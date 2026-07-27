require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function run() {
  const file1 = 'C:/Users/abebe/.gemini/antigravity-ide/brain/813a1f0d-5c1b-4ac7-b07c-efa171eddce7/media__1782071473770.jpg';

  if (fs.existsSync(file1)) {
    try {
      const res = await cloudinary.uploader.upload(file1, { folder: 'kambata' });
      console.log(`URL for image: ${res.secure_url}`);
    } catch (err) {
      console.error(`Failed to upload file1:`, err);
    }
  } else {
    console.error('File not found:', file1);
  }
}

run();
