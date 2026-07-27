const fs = require('fs');
const path = require('path');

const clientConfig = `import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    tracesSampleRate: 1,
    debug: false,
  });
}
`;

const configPaths = [
  'c:/kambata-travel/frontend/sentry.client.config.ts',
  'c:/kambata-travel/frontend/sentry.server.config.ts',
  'c:/kambata-travel/frontend/sentry.edge.config.ts'
];

configPaths.forEach(p => fs.writeFileSync(p, clientConfig));

// Update next.config.ts
const nextConfigPath = 'c:/kambata-travel/frontend/next.config.ts';
let nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');

if (!nextConfigContent.includes('@sentry/nextjs')) {
  nextConfigContent = nextConfigContent.replace(
    "import withPWAInit from '@ducanh2912/next-pwa';",
    "import withPWAInit from '@ducanh2912/next-pwa';\nimport { withSentryConfig } from '@sentry/nextjs';"
  );
  
  nextConfigContent = nextConfigContent.replace(
    "export default withPWA(nextConfig);",
    "export default withSentryConfig(withPWA(nextConfig), { silent: true });"
  );
  
  fs.writeFileSync(nextConfigPath, nextConfigContent);
}

// Update server.js
const serverPath = 'c:/kambata-travel/server/server.js';
let serverContent = fs.readFileSync(serverPath, 'utf8');

if (!serverContent.includes('@sentry/node')) {
  const sentryCode = `const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0, 
    profilesSampleRate: 1.0,
  });
}
`;
  serverContent = serverContent.replace("const express = require('express');", sentryCode + "\nconst express = require('express');");
  
  // Add Sentry request handler
  serverContent = serverContent.replace(
    "const app = express();",
    "const app = express();\nif (process.env.SENTRY_DSN) { Sentry.setupExpressErrorHandler(app); }"
  );
  
  fs.writeFileSync(serverPath, serverContent);
}

console.log("Sentry setup completed!");
