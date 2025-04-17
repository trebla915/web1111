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
      
      // Use the raw date from Firebase
      setEventDate(selectedEvent.date || '');
      
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
      const updatedEvent = {
        title: eventTitle,
        date: eventDate, // Use the raw date
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