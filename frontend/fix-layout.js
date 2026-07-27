const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'guide-dashboard', 'layout.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Find the start of SidebarContent
const sidebarStart = content.indexOf('const SidebarContent = ({ user, pathname, logout, router, setIsMobileMenuOpen }: any) => (');
if (sidebarStart === -1) {
  console.log('SidebarContent not found');
  process.exit(1);
}

// Find the end of SidebarContent
// We know it ends with:
//   );
//
//   return (
//     <div className="bg-[#F1F5F9] h-screen overflow-hidden flex dark:bg-[#0F172A]">
const endMarker = '  );\\n\\n  return (\\n    <div className="bg-[#F1F5F9] h-screen overflow-hidden flex dark:bg-[#0F172A]">';
// Wait, the newlines might be \r\n
const endRegex = /  \);\s*return \(\s*<div className="bg-\[#F1F5F9\] h-screen overflow-hidden flex dark:bg-\[#0F172A\]">/;
const match = content.match(endRegex);

if (!match) {
  console.log('End of SidebarContent not found');
  process.exit(1);
}

const sidebarEnd = match.index + 4; // '  );\n'

const sidebarCode = content.substring(sidebarStart, sidebarEnd);
content = content.substring(0, sidebarStart) + content.substring(sidebarEnd);

// Now insert sidebarCode right before export default function GuideDashboardLayout
const insertMarker = 'export default function GuideDashboardLayout';
const insertIndex = content.indexOf(insertMarker);

if (insertIndex === -1) {
  console.log('GuideDashboardLayout not found');
  process.exit(1);
}

content = content.substring(0, insertIndex) + sidebarCode + '\n\n' + content.substring(insertIndex);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully moved SidebarContent outside!');
