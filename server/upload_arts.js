require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function run() {
  const files = [
    { name: 'woodcraft', path: 'C:/Users/abebe/.gemini/antigravity-ide/brain/813a1f0d-5c1b-4ac7-b07c-efa171eddce7/heritage_woodcraft_1782038269811.png' },
    { name: 'pottery', path: 'C:/Users/abebe/.gemini/antigravity-ide/brain/813a1f0d-5c1b-4ac7-b07c-efa171eddce7/heritage_pottery_1782038279623.png' },
    { name: 'art', path: 'C:/Users/abebe/.gemini/antigravity-ide/brain/813a1f0d-5c1b-4ac7-b07c-efa171eddce7/heritage_art_1782038292596.png' }
  ];

  for (const f of files) {
    if (fs.existsSync(f.path)) {
      try {
        const res = await cloudinary.uploader.upload(f.path, { folder: 'kambata' });
        console.log(`URL for ${f.name}: ${res.secure_url}`);
      } catch (err) {
        console.error(`Failed to upload ${f.name}:`, err);
      }
    } else {
      console.error(`File not found: ${f.path}`);
    }
  }
}

run();
