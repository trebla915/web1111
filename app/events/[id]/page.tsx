import { getEvent } from "@/lib/services/events";
import { Metadata, ResolvingMetadata } from "next";
import EventDetails from "@/components/events/EventDetails";
import EventNotFound from "@/components/events/EventNotFound";
import { notFound } from "next/navigation";

// Updated Props type to satisfy Next.js 15.x PageProps constraints
type Props = {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
};

export default async function EventPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  try {
    const eventData = await getEvent(resolvedParams.id);
    if (!eventData) {
      notFound();
    }
    
    return <EventDetails event={eventData} />;
  } catch (error) {
    console.error("Error fetching event:", error);
    return <EventNotFound />;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.1111eptx.com';

export async function generateMetadata(
  { params }: { params: { id: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const event = await getEvent(resolvedParams.id);
  
  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The requested event could not be found.'
    };
  }

  const eventUrl = `${BASE_URL}/events/${event.id}`;
  const description = typeof event.description === 'string' && event.description
    ? event.description
    : `Join us for ${event.title} at 11:11 EPTX, El Paso's premier music and concert venue.`;
  const images = event.flyerUrl
    ? [{ url: event.flyerUrl, width: 1200, height: 630, alt: event.title }]
    : [{ url: `${BASE_URL}/og-image.jpg`, width: 1200, height: 630, alt: event.title }];

  return {
    title: event.title,
    description,
    alternates: { canonical: eventUrl },
    openGraph: {
      type: 'website',
      url: eventUrl,
      title: event.title,
      description,
      images,
      siteName: '11:11 EPTX',
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description,
      images: [event.flyerUrl || `${BASE_URL}/og-image.jpg`].filter(Boolean),
    },
  };
} 