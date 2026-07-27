require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function uploadImages() {
  try {
    const harvestRes = await cloudinary.uploader.upload('../frontend/public/images/harvest_festival.png', { folder: 'kambata' });
    console.log('Harvest URL:', harvestRes.secure_url);
    
    const gatheringRes = await cloudinary.uploader.upload('../frontend/public/images/cultural_gathering.png', { folder: 'kambata' });
    console.log('Gathering URL:', gatheringRes.secure_url);
  } catch (err) {
    console.error('Error uploading:', err);
  }
}

uploadImages();
