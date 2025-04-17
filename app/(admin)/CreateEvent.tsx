  // ... existing code ...

  const handleCreateEvent = async () => {
    if (!firebaseUser || !token) {
      Alert.alert('Error', 'You must be logged in to create an event.');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      let flyerUrl = '';

      if (flyerUri) {
        const filePath = `flyers/${firebaseUser.uid}/${Date.now()}_${eventName.trim()}.jpg`;
        flyerUrl = await uploadImageToStorage(flyerUri, filePath);
      }

      // Convert the selected date to Mountain Time
      const mtDate = selectedDate ? new Date(selectedDate.toLocaleString('en-US', {
        timeZone: 'America/Denver',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })) : null;

      // Set the time to noon Mountain Time to avoid timezone issues
      if (mtDate) {
        mtDate.setHours(12, 0, 0, 0);
      }

      const eventData = {
        title: eventName.trim(),
        date: mtDate ? mtDate.toISOString() : '',
        ticketLink: ticketLink.trim(),
        flyerUrl,
        userId: firebaseUser.uid,
        imageUrl: '', // Placeholder for compatibility
        reservationsEnabled,
      };

      await createEvent(eventData);

      Alert.alert('Success', 'Event created successfully!');

      // Clear form fields after success
      setEventName('');
      setFlyerUri(null);
      setTicketLink('');
      setSelectedDate(null);
      setReservationsEnabled(true);
    } catch (error) {
      console.error('[handleCreateEvent] Error creating event:', error);
      Alert.alert('Error', 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  // ... existing code ...