require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const IMAGES_DIR = path.join(__dirname, '../frontend/public/images');
const DIRS_TO_SCAN = [
  path.join(__dirname, '../frontend/src'),
  path.join(__dirname, '../admin-portal/src')
];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (['.tsx', '.ts', '.jsx', '.js', '.css'].includes(ext)) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

async function run() {
  const urlMap = {};
  console.log('Uploading images to Cloudinary...');
  const files = fs.readdirSync(IMAGES_DIR);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext)) continue;
    
    const filePath = path.join(IMAGES_DIR, file);
    const localPath = `/images/${file}`;
    console.log(`Uploading ${file}...`);
    try {
      const res = await cloudinary.uploader.upload(filePath, { folder: 'kambata' });
      urlMap[localPath] = res.secure_url;
      console.log(` -> ${res.secure_url}`);
    } catch (e) {
      console.error(`Failed to upload ${file}:`, e.message);
    }
  }

  console.log('Scanning codebase to replace references...');
  const allCodeFiles = [];
  DIRS_TO_SCAN.forEach(dir => {
    if (fs.existsSync(dir)) {
      getAllFiles(dir, allCodeFiles);
    }
  });

  let filesUpdated = 0;
  for (const codeFile of allCodeFiles) {
    let content = fs.readFileSync(codeFile, 'utf8');
    let original = content;
    
    for (const [localPath, cloudUrl] of Object.entries(urlMap)) {
      // Create a global regex to replace all occurrences.
      const escapedPath = localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedPath, 'g');
      content = content.replace(regex, cloudUrl);
    }

    if (content !== original) {
      fs.writeFileSync(codeFile, content, 'utf8');
      console.log(`Updated: ${codeFile}`);
      filesUpdated++;
    }
  }
  
  console.log(`Complete! Updated ${filesUpdated} files.`);
}

run();
