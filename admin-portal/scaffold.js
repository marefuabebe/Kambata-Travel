const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src', 'app');

const dirs = [
  'customers',
  'bookings/tour',
  'bookings/hotel',
  'bookings/package',
  'tours/schedules',
  'hotels',
  'hotels/rooms',
  'guides/assignments',
  'payments',
  'attendance',
  'incidents',
  'analytics',
  'settings'
];

const stubContent = `"use client";
import React from "react";
import { LayoutDashboard } from "lucide-react";

export default function PageStub() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-6">
        <LayoutDashboard size={32} />
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-4">Module Under Construction</h1>
      <p className="text-gray-500 font-medium">This section is currently being integrated with the new Agency Model.</p>
    </div>
  );
}
`;

dirs.forEach(dir => {
  const fullPath = path.join(baseDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  
  const pagePath = path.join(fullPath, 'page.tsx');
  if (!fs.existsSync(pagePath)) {
    fs.writeFileSync(pagePath, stubContent);
  }
});

// Move existing pages if they exist
try {
  if (fs.existsSync(path.join(baseDir, 'users', 'page.tsx'))) {
    fs.renameSync(path.join(baseDir, 'users', 'page.tsx'), path.join(baseDir, 'customers', 'page.tsx'));
    console.log("Moved users to customers");
  }
  if (fs.existsSync(path.join(baseDir, 'bookings', 'page.tsx'))) {
    fs.renameSync(path.join(baseDir, 'bookings', 'page.tsx'), path.join(baseDir, 'bookings', 'tour', 'page.tsx'));
    console.log("Moved bookings to bookings/tour");
  }
  if (fs.existsSync(path.join(baseDir, 'payouts', 'page.tsx'))) {
    fs.renameSync(path.join(baseDir, 'payouts', 'page.tsx'), path.join(baseDir, 'payments', 'page.tsx'));
    console.log("Moved payouts to payments");
  }
} catch (err) {
  console.error("Error moving files", err);
}

console.log("Scaffolding complete.");
