import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://kambata-travel.vercel.app';

  // Define all static public routes
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/explore',
    '/gallery',
    '/heritage',
    '/tours',
    '/guides',
    '/privacy',
    '/terms'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Attempt to fetch dynamic public pages (e.g., guides)
  // Catch errors to prevent build failures if backend is down during Vercel build
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // Fetch active guides. Assuming the endpoint exists.
    const res = await fetch(`${apiUrl}/guides`, { next: { revalidate: 3600 } });
    
    if (res.ok) {
      const data = await res.json();
      // Assume data.guides or data is an array
      const guides = Array.isArray(data.guides) ? data.guides : (Array.isArray(data) ? data : []);
      
      dynamicRoutes = guides.map((guide: any) => ({
        url: `${baseUrl}/guides/${guide._id || guide.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.warn('Failed to fetch dynamic routes for sitemap', error);
  }

  return [...staticRoutes, ...dynamicRoutes];
}
