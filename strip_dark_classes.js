const fs = require('fs');
const path = require('path');

const targetDirs = [
  'src/components/home',
  'src/app'
];
const targetFiles = [
  'src/components/layout/Header.tsx',
  'src/components/layout/Footer.tsx'
];

function processFile(filePath) {
  // Read file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip dashboard/admin directories
  if (filePath.includes('explorer-dashboard') || filePath.includes('guide-dashboard') || filePath.includes('admin-portal')) {
    return;
  }
  
  // Remove `dark:` prefix from classes
  // The regex looks for `dark:` followed by tailwind class characters
  // It handles simple classes like `dark:bg-white` and complex ones like `dark:hover:text-emerald-400`
  const regex = /\s+dark:[a-zA-Z0-9\-\/\[\]\#\:\.]+/g;
  const newContent = content.replace(regex, '');
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Processed: ${filePath}`);
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

// Process files
for (const dir of targetDirs) {
  const fullPath = path.join(__dirname, 'frontend', dir);
  if (fs.existsSync(fullPath)) {
    processDirectory(fullPath);
  }
}

for (const file of targetFiles) {
  const fullPath = path.join(__dirname, 'frontend', file);
  if (fs.existsSync(fullPath)) {
    processFile(fullPath);
  }
}

console.log('Finished removing dark: classes.');
