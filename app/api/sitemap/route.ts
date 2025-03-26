import { NextResponse } from 'next/server';
import { fetchAllEvents } from '@/lib/services/events';

export async function GET() {
  try {
    // Base URL for the site
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.1111eptx.com';
    
    // Static routes
    const staticRoutes = [
      { url: '/', lastmod: new Date().toISOString().split('T')[0], priority: 1.0, changefreq: 'weekly' },
      { url: '/events', lastmod: new Date().toISOString().split('T')[0], priority: 0.9, changefreq: 'daily' },
      { url: '/reserve', lastmod: new Date().toISOString().split('T')[0], priority: 0.8, changefreq: 'monthly' },
      { url: '/rules', lastmod: new Date().toISOString().split('T')[0], priority: 0.7, changefreq: 'monthly' },
      { url: '/auth/login', lastmod: new Date().toISOString().split('T')[0], priority: 0.6, changefreq: 'monthly' },
      { url: '/auth/register', lastmod: new Date().toISOString().split('T')[0], priority: 0.6, changefreq: 'monthly' },
    ];
    
    // Fetch dynamic event routes
    let dynamicRoutes: Array<{ url: string, lastmod: string, priority: number, changefreq: string }> = [];
    
    try {
      const events = await fetchAllEvents();
      
      if (events && Array.isArray(events)) {
        dynamicRoutes = events.map(event => ({
          url: `/events/${event.id}`,
          lastmod: (event.updated || event.created) 
            ? new Date(event.updated || event.created).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0],
          priority: 0.8,
          changefreq: 'weekly'
        }));
      }
    } catch (error) {
      console.error('Error fetching events for sitemap:', error);
      // Continue with static routes even if dynamic routes fail
    }
    
    // Combine static and dynamic routes
    const allRoutes = [...staticRoutes, ...dynamicRoutes];
    
    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('')}
</urlset>`;
    
    // Return the sitemap as XML
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400'
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return a basic sitemap with just static routes in case of error
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.1111eptx.com';
    const staticRoutes = [
      { url: '/', lastmod: new Date().toISOString().split('T')[0], priority: 1.0, changefreq: 'weekly' },
      { url: '/events', lastmod: new Date().toISOString().split('T')[0], priority: 0.9, changefreq: 'daily' },
      { url: '/reserve', lastmod: new Date().toISOString().split('T')[0], priority: 0.8, changefreq: 'monthly' },
      { url: '/rules', lastmod: new Date().toISOString().split('T')[0], priority: 0.7, changefreq: 'monthly' },
      { url: '/auth/login', lastmod: new Date().toISOString().split('T')[0], priority: 0.6, changefreq: 'monthly' },
      { url: '/auth/register', lastmod: new Date().toISOString().split('T')[0], priority: 0.6, changefreq: 'monthly' },
    ];
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticRoutes.map(route => `
  <url>
    <loc>${baseUrl}${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('')}
</urlset>`;
    
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400'
      }
    });
  }
} 