require('dotenv').config({ path: 'c:/kambata-travel/server/.env' });
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

cloudinary.uploader.upload('C:/Users/abebe/.gemini/antigravity/brain/fd212c12-e355-4f5d-8e1b-5b1e3f5c2f5b/kambata_profile_pic_1780533290367.png', {
  folder: 'kambata-assets',
  public_id: 'email_logo'
}).then(result => {
  console.log('UPLOAD_SUCCESS:', result.secure_url);
}).catch(err => {
  console.error('UPLOAD_ERROR:', err);
});
