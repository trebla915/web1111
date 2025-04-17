import { formatToMMDDYYYY } from '@/lib/utils/dateFormatter';

  // ... existing code ...

  const handleEventSelection = (eventId: string) => {
    const selectedEvent = events.find((event) => event.id === eventId);
    if (selectedEvent) {
      console.log('Selected event:', {
        id: selectedEvent.id,
        title: selectedEvent.title,
        reservationsEnabled: selectedEvent.reservationsEnabled
      });
      setSelectedEventId(eventId);
      setEventTitle(selectedEvent.title || '');
      
      // Use the standardized date formatter
      setEventDate(selectedEvent.date ? formatToMMDDYYYY(selectedEvent.date) : '');
      
      setTicketLink(selectedEvent.ticketLink || '');
      setReservationsEnabled(selectedEvent.reservationsEnabled ?? true);
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEventId) {
      Alert.alert('Error', 'No event selected.');
      return;
    }

    setLoading(true);
    try {
      // Parse the input date string and convert to Mountain Time
      let mtDate = null;
      if (eventDate) {
        const [month, day, year] = eventDate.split('/');
        const dateObj = new Date(+year, +month - 1, +day);
        mtDate = new Date(dateObj.toLocaleString('en-US', {
          timeZone: 'America/Denver',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }));
        // Set to noon Mountain Time
        mtDate.setHours(12, 0, 0, 0);
      }

      const updatedEvent = {
        title: eventTitle,
        date: mtDate ? mtDate.toISOString() : '',
        ticketLink,
        reservationsEnabled,
      };
      
      console.log('Updating event:', {
        eventId: selectedEventId,
        ...updatedEvent
      });
      
      const response = await updateEvent(selectedEventId, updatedEvent);
      console.log('Update response:', response);
      Alert.alert('Success', 'Event updated successfully.');
      loadEvents(); // Reload events to reflect updates
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  // ... existing code ...