import { Event } from '@/types/event';
import { sendPushNotification } from './notifications';

function getEventsApiBase(): string {
  return '/api';
}

async function fetchEventsApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getEventsApiBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error = new Error((body as { error?: string }).error || 'Request failed') as Error & {
      response?: { status: number };
    };
    error.response = { status: response.status };
    throw error;
  }
  return response.json() as Promise<T>;
}

function normalizeEventsList(data: unknown): Event[] {
  const events = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && 'events' in data
      ? (data as { events: Event[] }).events
      : [];

  return events.filter((event: unknown): event is Event => {
    if (!event || typeof event !== 'object') {
      console.warn('Invalid event object:', event);
      return false;
    }

    const e = event as Event;
    if (!e.id || typeof e.id !== 'string') {
      console.warn('Event missing id or invalid id type:', event);
      return false;
    }

    if (!e.title || typeof e.title !== 'string') {
      console.warn('Event missing title or invalid title type:', event);
      return false;
    }

    if (e.date) {
      try {
        const dateStr = e.date.includes('T') ? e.date : `${e.date}T00:00:00.000Z`;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date format:', e.date);
          return false;
        }
      } catch (err) {
        console.warn('Error parsing date:', e.date, err);
        return false;
      }
    }

    return true;
  });
}

export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const data = await fetchEventsApi<unknown>('/events');
    return normalizeEventsList(data);
  } catch (error) {
    console.error('Error getting all events:', error);
    return [];
  }
};

export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    return await fetchEventsApi<Event>(`/events/${id}`);
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      return null;
    }
    console.error('Error getting event:', error);
    throw error;
  }
};

export const createEvent = async (eventData: Omit<Event, 'id'>): Promise<Event> => {
  try {
    const event = await fetchEventsApi<Event>('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });

    try {
      await sendPushNotification({
        title: 'New Event Added',
        message: `A new event "${eventData.title}" has been added to the calendar!`,
        data: {
          eventId: event.id,
          eventTitle: eventData.title,
          eventDate: eventData.date,
          type: 'event_created',
        },
      });
    } catch (notificationError) {
      console.error('Failed to send notification for new event:', notificationError);
    }

    return event;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, eventData: Partial<Event>): Promise<void> => {
  try {
    await fetchEventsApi<Event>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    await fetchEventsApi(`/events/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

export const getUpcomingEvents = async (): Promise<Event[]> => {
  try {
    const events = await getAllEvents();
    const now = new Date();
    const year = now.getFullYear();

    const filteredEvents = events.filter((event: Event) => {
      try {
        if (!event.date) {
          console.warn(`Event "${event.title}" has no date`);
          return false;
        }

        const [datePart] = event.date.split('T');
        const [eventYear, eventMonth, eventDay] = datePart.split('-').map(Number);
        const eventDate = new Date(eventYear, eventMonth - 1, eventDay);

        if (isNaN(eventDate.getTime())) {
          console.warn(`Invalid date format for event "${event.title}": ${event.date}`);
          return false;
        }

        const currentDate = new Date(year, now.getMonth(), now.getDate());
        eventDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        return eventDate >= currentDate;
      } catch (err) {
        console.warn(`Error processing event "${event.title}":`, err);
        return false;
      }
    });

    return filteredEvents;
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return [];
  }
};

export const fetchAllEvents = getAllEvents;
