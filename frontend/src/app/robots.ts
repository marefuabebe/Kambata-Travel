import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/explorer-dashboard/',
        '/guide-dashboard/',
        '/login',
        '/register',
        '/forgot-password',
        '/verify-email',
        '/payment-callback',
        '/checkout/',
        '/checkout-package/'
      ],
    },
    sitemap: 'https://kambata-travel.vercel.app/sitemap.xml',
  };
}
