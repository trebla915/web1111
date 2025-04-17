  // ... existing code ...

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('===== CREATING EVENT =====');
    
    if (!user) {
      console.error('User not logged in');
      toast.error('You must be logged in to create an event.');
      return;
    }

    if (!validateForm()) {
      console.error('Form validation failed');
      return;
    }

    setLoading(true);
    try {
      let flyerUrl = '';

      if (flyerFile) {
        try {
          const timestamp = Date.now();
          const sanitizedFilename = eventName.trim().replace(/[^a-z0-9]/gi, '_');
          const filePath = `flyers/${user.uid}/${timestamp}_${sanitizedFilename}.jpg`;
          
          console.log(`[handleCreateEvent] Preparing flyer image for upload:`);
          console.log(`- Event name: ${eventName}`);
          console.log(`- File path: ${filePath}`);
          
          try {
            console.log(`[handleCreateEvent] Starting standard image upload...`);
            flyerUrl = await uploadImageToStorage(flyerFile, filePath);
            console.log(`[handleCreateEvent] Standard image upload successful: ${flyerUrl}`);
          } catch (uploadError) {
            console.error(`[handleCreateEvent] Standard upload failed, trying event service direct upload...`, uploadError);
            
            const base64Data = await convertToBase64();
            console.log(`[handleCreateEvent] Image converted to base64. Creating event with inline image...`);
            
            const eventData = {
              title: eventName.trim(),
              date: selectedDate?.toISOString(),
              ticketLink: ticketLink.trim(),
              flyerUrl: '',
              flyerBase64: base64Data,
              createdBy: user.uid,
              createdAt: new Date().toISOString(),
            };

            const event = await createEvent(eventData);
            console.log(`[handleCreateEvent] Event created successfully with base64 image:`, event);
            toast.success('Event created successfully!');
            return;
          }
        } catch (error) {
          console.error('Error handling flyer image:', error);
          toast.error('Failed to process flyer image');
          return;
        }
      }

      const eventData = {
        title: eventName.trim(),
        date: selectedDate?.toISOString() || '',
        ticketLink: ticketLink.trim(),
        flyerUrl,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        reservationsEnabled
      };

      console.log('Creating event with data:', eventData);
      await createEvent(eventData);
      
      toast.success('Event created successfully!');
      // Reset form
      setEventName('');
      setSelectedDate(null);
      setTicketLink('');
      setFlyerFile(null);
      if (flyerPreview) {
        URL.revokeObjectURL(flyerPreview);
        setFlyerPreview(null);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ... existing code ...