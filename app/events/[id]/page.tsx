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
  try {
    const eventData = await getEvent(params.id);
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
  const event = await getEvent(params.id);
  
  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The requested event could not be found.'
    };
  }

  return {
    title: event.title,
    description: event.description,
    openGraph: {
      title: event.title,
      description: event.description,
      images: event.image ? [event.image] : [],
    },
  };
} 