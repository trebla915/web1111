import { fetchEventById } from "@/lib/services/events";
import { Metadata, ResolvingMetadata } from "next";
import EventDetails from "@/components/events/EventDetails";
import EventNotFound from "@/components/events/EventNotFound";
import { notFound } from "next/navigation";

export default async function EventPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    const eventData = await fetchEventById(params.id);
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
  try {
    // Fetch the event data
    const event = await fetchEventById(params.id);
    
    if (!event) {
      return {
        title: "Event Not Found | 11:11 EPTX",
        description: "The requested event could not be found.",
      };
    }
    
    // Format the date for display in metadata
    const eventDate = event.date ? new Date(event.date) : null;
    const formattedDate = eventDate 
      ? eventDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        }) 
      : 'Date TBA';
    
    // Get the parent metadata
    const previousImages = (await parent).openGraph?.images || [];
    
    return {
      title: `${event.title} | 11:11 EPTX`,
      description: `Join us for ${event.title} on ${formattedDate} at 11:11 EPTX. ${event.description?.substring(0, 150)}...`,
      openGraph: {
        title: `${event.title} | 11:11 EPTX`,
        description: `Join us for ${event.title} on ${formattedDate} at 11:11 EPTX.`,
        images: event.imageUrl 
          ? [event.imageUrl, ...previousImages]
          : previousImages,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${event.title} | 11:11 EPTX`,
        description: `Join us for ${event.title} on ${formattedDate} at 11:11 EPTX.`,
        images: event.imageUrl ? [event.imageUrl] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Event Details | 11:11 EPTX',
      description: 'View event details and reserve your spot at 11:11 EPTX.',
    };
  }
} 