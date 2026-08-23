const fs = require('fs');
const path = require('path');

const directories = [
    'c:/kambata-travel/frontend/src/app/explorer-dashboard',
    'c:/kambata-travel/frontend/src/app/guide-dashboard',
];

function replaceInFile(filepath) {
    const content = fs.readFileSync(filepath, 'utf-8');
    
    // Replace bg-gradient-to-br from-x to-y dark:from-a dark:to-b with bg-white dark:bg-[#1E293B]
    let newContent = content.replace(/bg-gradient-to-br\s+from-[^\s]+\s+(via-[^\s]+\s+)?to-[^\s]+\s+dark:from-[^\s]+\s+dark:to-[^\s]+/g, 'bg-white dark:bg-[#1E293B]');
    
    // Replace remaining bg-gradient-to-br from-[#1E293B] to-[#0F172A] (support page)
    newContent = newContent.replace(/bg-gradient-to-br\s+from-\[#1E293B\]\s+to-\[#0F172A\]/g, 'bg-white dark:bg-[#1E293B]');
    
    // Remove the ambient glows (divs with absolute, blur-, and pointer-events-none)
    newContent = newContent.replace(/<div\s+className=\"absolute[^>]*blur-[^>]*pointer-events-none[^\"]*\"\s*\/>/g, '');
    
    if (newContent !== content) {
        fs.writeFileSync(filepath, newContent, 'utf-8');
        console.log('Updated gradients in:', filepath);
    }
}

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

directories.forEach(dir => {
    walkSync(dir, (filepath) => {
        if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
            replaceInFile(filepath);
        }
    });
});
