import { Event } from '@/types/event';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { sendPushNotification } from './notifications';

export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const response = await apiClient.get('/events');
    
    // Handle different response formats
    const events = Array.isArray(response.data) ? response.data : 
                  (response.data && response.data.events ? response.data.events : []);
    
    // Validate and clean the events array
    return events.filter((event: any): event is Event => {
      if (!event || typeof event !== 'object') {
        console.warn('Invalid event object:', event);
        return false;
      }
      
      // Ensure required fields exist and are of correct type
      if (!event.id || typeof event.id !== 'string') {
        console.warn('Event missing id or invalid id type:', event);
        return false;
      }
      
      if (!event.title || typeof event.title !== 'string') {
        console.warn('Event missing title or invalid title type:', event);
        return false;
      }
      
      // Ensure date is in correct format
      if (event.date) {
        try {
          // If date doesn't include time, append UTC midnight
          const dateStr = event.date.includes('T') ? event.date : `${event.date}T00:00:00.000Z`;
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            console.warn('Invalid date format:', event.date);
            return false;
          }
        } catch (err) {
          console.warn('Error parsing date:', event.date, err);
          return false;
        }
      }
      
      return true;
    });
  } catch (error) {
    console.error('Error getting all events:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      console.log(`Event with ID ${id} not found`);
      return null;
    }
    console.error('Error getting event:', error);
    throw error;
  }
};

export const createEvent = async (eventData: Omit<Event, 'id'>): Promise<Event> => {
  try {
    const response = await apiClient.post('/events', eventData);
    
    // Send push notification about the new event
    try {
      await sendPushNotification({
        title: 'New Event Added',
        message: `A new event "${eventData.title}" has been added to the calendar!`,
        data: {
          eventId: response.data.id,
          eventTitle: eventData.title,
          eventDate: eventData.date,
          type: 'event_created'
        }
      });
    } catch (notificationError) {
      // Log but don't throw the error - we don't want to fail event creation if notification fails
      console.error('Failed to send notification for new event:', notificationError);
    }

    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, eventData: Partial<Event>): Promise<void> => {
  try {
    await apiClient.put(`/events/${id}`, eventData);
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/events/${id}`);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

export const getUpcomingEvents = async (): Promise<Event[]> => {
  try {
    const response = await apiClient.get('/events');
    const now = new Date();
    // Get current date in local time YYYY-MM-DD format
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const currentDateStr = `${year}-${month}-${day}`;
    
    // Check the response structure and access the events array properly
    const events = Array.isArray(response.data) ? response.data : 
                  (response.data && response.data.events ? response.data.events : []);
    
    console.log('Current date for comparison (local time):', currentDateStr);
    console.log('All events:', events.map((e: Event) => ({ title: e.title, date: e.date })));
    
    const filteredEvents = events.filter((event: Event) => {
      try {
        if (!event.date) {
          console.warn(`Event "${event.title}" has no date`);
          return false;
        }
        
        // Parse the event date directly (YYYY-MM-DD format)
        const [datePart] = event.date.split('T');
        const [eventYear, eventMonth, eventDay] = datePart.split('-').map(Number);
        
        // Create date object using the parsed components in local time
        const eventDate = new Date(eventYear, eventMonth - 1, eventDay);
        
        // Check if the date is valid
        if (isNaN(eventDate.getTime())) {
          console.warn(`Invalid date format for event "${event.title}": ${event.date}`);
          return false;
        }
        
        // Get current date object in local time for comparison
        const currentDate = new Date(year, now.getMonth(), now.getDate());
        
        // Set both dates to start of day to avoid time comparison issues
        eventDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        
        // Include events that are today or in the future
        const isIncluded = eventDate >= currentDate;
        console.log(`Event "${event.title}" (${event.date}): ${isIncluded ? 'INCLUDED' : 'EXCLUDED'}`);
        return isIncluded;
      } catch (err) {
        console.warn(`Error processing event "${event.title}":`, err);
        return false;
      }
    });
    
    console.log('Filtered events:', filteredEvents.map((e: Event) => ({ title: e.title, date: e.date })));
    return filteredEvents;
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
};

// Alias for getAllEvents for the sitemap generator
export const fetchAllEvents = getAllEvents; 