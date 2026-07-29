import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import { withSentryConfig } from '@sentry/nextjs';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheStartUrl: true,
  dynamicStartUrl: true,
  workboxOptions: {
    disableDevLogs: true,
    exclude: [
      /^\/api\/auth\/.*/i, 
      /^\/api\/payments\/.*/i,
      /^\/api\/qr\/.*/i,
      /^\/checkout\/.*/i,
      /^\/login/i,
      /^\/register/i
    ],
  }
});

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/guide%20dashboard/:path*',
        destination: '/guide-dashboard/:path*',
        permanent: true,
      },
      {
        source: '/guide%20dashboard',
        destination: '/guide-dashboard',
        permanent: true,
      }
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  allowedDevOrigins: ['192.168.1.114', 'shamrock-survey-childhood.ngrok-free.dev'],
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'www.svgrepo.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default withSentryConfig(withPWA(nextConfig), { silent: true });
