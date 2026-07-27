const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('c:/kambata-travel/frontend/src/app/guide-dashboard');
let count = 0;
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (!content.includes('"use client"')) {
        fs.writeFileSync(f, '"use client";\n\n' + content);
        count++;
    }
});
console.log(`Added "use client" to ${count} files.`);
