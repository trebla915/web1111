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

  return {
    title: event.title,
    ...('description' in event && typeof event.description === 'string' && event.description ? { description: event.description } : {}),
    openGraph: {
      title: event.title,
      ...('description' in event && typeof event.description === 'string' && event.description ? { description: event.description } : {}),
      images: event.flyerUrl ? [event.flyerUrl] : [],
    },
  };
} 