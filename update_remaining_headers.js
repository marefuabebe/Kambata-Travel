const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  {
    path: 'frontend/src/app/explorer-dashboard/payments/page.tsx',
    regex: /<div className="flex items-center gap-3 mb-6">[\s\S]*?<\/h1>\n\s*<\/div>/,
    replacement: `<div className="mb-6">\n          <PageHeader title={t("payments.title")} />\n        </div>`,
    addImport: `import { PageHeader } from "@/components/explorer/ui";\n`
  },
  {
    path: 'frontend/src/app/explorer-dashboard/reviews/page.tsx',
    regex: /<div className="mb-8">\n\s*<h1.*?<\/h1>\n\s*<p.*?<\/p>\n\s*<\/div>/,
    replacement: `<PageHeader title={t("reviews.title")} subtitle={t("reviews.subtitle")} />`,
    addImport: `import { PageHeader } from "@/components/explorer/ui";\n`
  },
  {
    path: 'frontend/src/app/explorer-dashboard/notifications/page.tsx',
    regex: /<div className="mb-8">\n\s*<h1.*?<\/h1>\n\s*<p.*?<\/p>\n\s*<\/div>/,
    replacement: `<PageHeader title={t("notifications.title")} subtitle={t("notifications.subtitle")} />`,
    addImport: `import { PageHeader } from "@/components/explorer/ui";\n`
  },
  {
    path: 'frontend/src/app/explorer-dashboard/messages/page.tsx',
    regex: /<div className="mb-6 px-4">\n\s*<h1.*?<\/h1>\n\s*<p.*?<\/p>\n\s*<\/div>/,
    replacement: `<div className="px-4"><PageHeader title={t("messages.title")} subtitle={t("messages.subtitle")} /></div>`,
    addImport: `import { PageHeader } from "@/components/explorer/ui";\n`
  },
  {
    path: 'frontend/src/app/explorer-dashboard/sos/page.tsx',
    regex: /<div className="flex items-center justify-between mb-8">[\s\S]*?<\/h1>\n\s*<\/div>\n\s*<button[\s\S]*?<\/button>\n\s*<\/div>/,
    replacement: `<PageHeader \n            title={t("sos.title")}\n            subtitle={t("sos.subtitle")}\n            action={\n              <button\n                onClick={() => setCallActive(!callActive)}\n                className={\`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors \${callActive ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20" : "bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"}\`}\n              >\n                <Phone size={16} className={callActive ? "animate-pulse" : ""} />\n                {callActive ? t("sos.btnEndCall") : t("sos.btnCallSupport")}\n              </button>\n            }\n          />`,
    addImport: `import { PageHeader } from "@/components/explorer/ui";\n`
  },
  {
    path: 'frontend/src/app/explorer-dashboard/settings/page.tsx',
    regex: /<div className="mb-8">[\s\S]*?<div className="flex items-center gap-4">[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/div>/,
    replacement: `<PageHeader \n              title={formData.name || "Your Name"}\n              subtitle={user?.email || "email@example.com"}\n              action={\n                <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-white/10 flex items-center justify-center text-teal-600 dark:text-white font-black text-2xl border-4 border-white dark:border-[#0F172A] shadow-md">\n                  {(formData.name || "Y")[0].toUpperCase()}\n                </div>\n              }\n            />`,
    addImport: `import { PageHeader } from "@/components/explorer/ui";\n`
  }
];

filesToUpdate.forEach(({ path: filePath, regex, replacement, addImport }) => {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.match(regex)) {
    content = content.replace(regex, replacement);
    if (!content.includes('PageHeader')) {
      const lastImportIndex = content.lastIndexOf('import ');
      const endOfLastImport = content.indexOf('\\n', lastImportIndex);
      content = content.slice(0, endOfLastImport + 1) + addImport + content.slice(endOfLastImport + 1);
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`Regex did not match for ${filePath}`);
  }
});
