import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.1111eptx.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/reserve`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/auth/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/auth/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  let eventEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${BASE_URL}/api/events`, { next: { revalidate: 3600 } });
    const data = await res.json();
    const events = Array.isArray(data) ? data : data?.events ?? [];
    eventEntries = events.map((event: { id: string; updated?: string; created?: string }) => ({
      url: `${BASE_URL}/events/${event.id}`,
      lastModified: event.updated || event.created ? new Date(event.updated || event.created) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // continue with static-only sitemap
  }

  return [...staticEntries, ...eventEntries];
}
