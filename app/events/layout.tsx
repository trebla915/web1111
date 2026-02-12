import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.1111eptx.com';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Discover upcoming concerts, live music, and events at 11:11 EPTX in El Paso, Texas. Reserve tables and get tickets.',
  alternates: { canonical: `${BASE_URL}/events` },
  openGraph: {
    url: `${BASE_URL}/events`,
    title: 'Events | 11:11 EPTX',
    description: 'Upcoming concerts and events at 11:11 EPTX, El Paso.',
    siteName: '11:11 EPTX',
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
