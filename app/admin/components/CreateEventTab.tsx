"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { uploadImageToStorage } from '@/lib/services/storage';
import { createEvent } from '@/lib/services/events';
import { checkRequiredEnvVars } from '@/lib/utils/env-check';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { FiCalendar, FiLink, FiUpload, FiTrash2, FiPlus, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { getAuth } from 'firebase/auth';

export default function CreateEventTab() {
  const { user } = useAuth();
  const [eventName, setEventName] = useState('');
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [ticketLink, setTicketLink] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [envVarsChecked, setEnvVarsChecked] = useState(false);
  const [reservationsEnabled, setReservationsEnabled] = useState(true);

  // Check environment variables on component mount
  useEffect(() => {
    const envVarsValid = checkRequiredEnvVars();
    if (!envVarsValid) {
      setDebugInfo('Warning: Some Firebase environment variables are missing. Check the console for details.');
    } else {
      setDebugInfo('Firebase environment variables OK');
    }
    setEnvVarsChecked(true);
  }, []);

  // Debug function to test authentication token
  const testAuthToken = async () => {
    setDebugInfo('Testing authentication...');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      setDebugInfo('No user is signed in. Please sign in first.');
      return;
    }
    
    try {
      const token = await currentUser.getIdToken(true);
      const tokenPreview = `${token.substring(0, 20)}...${token.substring(token.length - 20)}`;
      
      console.log('===== AUTH DEBUG =====');
      console.log('User ID:', currentUser.uid);
      console.log('Email:', currentUser.email);
      console.log('Token preview:', tokenPreview);
      console.log('Is Anonymous:', currentUser.isAnonymous);
      console.log('Provider ID:', currentUser.providerId);
      console.log('Creation time:', currentUser.metadata.creationTime);
      console.log('Last sign in time:', currentUser.metadata.lastSignInTime);
      
      // Show initial token info
      setDebugInfo(`Auth OK: Token obtained. Checking token validity...`);
      
      // Check if storage bucket is configured
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      
      if (!storageBucket) {
        console.error('Storage bucket environment variable is missing');
        setDebugInfo(`Error: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable is not set.`);
        return;
      }
      
      console.log('Storage bucket:', storageBucket);
      
      try {
        // Test fetch to check token validity with Firebase
        const url = `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o?prefix=test/`;
        console.log('Testing URL:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Firebase ${token}`
          },
          // Add a timeout to the fetch request
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Storage API test successful:', data);
          setDebugInfo(`Auth OK: Token is valid. Storage API test successful!`);
        } else {
          const errorText = await response.text();
          console.error('Storage API test failed:', response.status, response.statusText, errorText);
          setDebugInfo(`Auth OK but Storage API test failed: ${response.status} ${response.statusText}. See console for details.`);
        }
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError);
        
        // Provide more helpful error messages
        if (fetchError.name === 'TypeError' && fetchError.message === 'Failed to fetch') {
          setDebugInfo(`Network error: Could not connect to Firebase Storage API. Check your network connection or CORS settings.`);
        } else if (fetchError.name === 'AbortError') {
          setDebugInfo(`Fetch timed out: The request to Firebase Storage API took too long to complete.`);
        } else {
          setDebugInfo(`Fetch error: ${fetchError.message}`);
        }
      }
    } catch (error: any) {
      console.error('Auth test error:', error);
      setDebugInfo(`Auth Error: ${error.message}`);
    }
  };

  const validateForm = () => {
    if (!eventName.trim()) {
      toast.error('Event name is required.');
      return false;
    }
    if (!selectedDate) {
      toast.error('Event date is required.');
      return false;
    }
    return true;
  };

  const handleFlyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('===== FILE SELECTION DEBUG =====');
      console.log('Selected file:', {
        name: file.name,
        type: file.type,
        size: `${Math.round(file.size / 1024)} KB`,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      // Check if it's a valid image file
      if (!file.type.startsWith('image/')) {
        console.warn('File is not an image:', file.type);
        toast.error('Please select a valid image file');
        return;
      }

      // Check file size
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        console.warn(`File is too large: ${Math.round(file.size / 1024)} KB, max: ${MAX_SIZE / 1024} KB`);
        toast.error('Image file is too large (max 5MB)');
        return;
      }
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
      console.log('Created object URL:', objectUrl);
      
      setFlyerFile(file);
      setFlyerPreview(objectUrl);
    }
  };

  const removeFlyerImage = () => {
    setFlyerFile(null);
    if (flyerPreview) {
      URL.revokeObjectURL(flyerPreview);
      setFlyerPreview(null);
    }
  };

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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-cyan-300 digital-glow-soft">Create Event</h2>
      
      {/* Debug button - only visible in dev or when there's an issue */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-4 bg-gray-900 border border-yellow-600/40 rounded-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-yellow-400 font-medium flex items-center">
              <FiAlertCircle className="mr-2" /> Debugging Tools
            </h3>
            <button
              type="button"
              onClick={testAuthToken}
              className="px-3 py-1 bg-yellow-900/30 hover:bg-yellow-800/40 border border-yellow-600/40 text-yellow-400 rounded-md text-sm flex items-center"
            >
              <FiInfo className="mr-1" /> Test Auth
            </button>
          </div>
          {debugInfo && (
            <div className="text-sm font-mono p-2 bg-black/40 text-yellow-300 rounded border border-yellow-600/20 overflow-x-auto">
              {debugInfo}
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleCreateEvent} className="max-w-2xl mx-auto">
        <div className="bg-zinc-900 border border-cyan-900/30 rounded-lg p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 noise opacity-5"></div>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
          
          {/* Event Name */}
          <div className="mb-6 relative z-10">
            <label htmlFor="eventName" className="block text-lg font-medium mb-2 text-white">
              Event Name <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <input
                id="eventName"
                type="text"
                className="w-full p-3 pl-4 bg-zinc-800 border border-cyan-900/50 rounded-lg text-white focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                placeholder="Enter event name"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                required
              />
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500"></div>
            </div>
          </div>

          {/* Event Date */}
          <div className="mb-6 relative z-10">
            <label htmlFor="eventDate" className="block text-lg font-medium mb-2 text-white">
              Event Date <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400">
                <FiCalendar />
              </div>
              <input
                id="eventDate"
                type="date"
                className="w-full p-3 pl-10 bg-zinc-800 border border-cyan-900/50 rounded-lg text-white focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                required
              />
            </div>
          </div>

          {/* Ticket Link */}
          <div className="mb-6 relative z-10">
            <label htmlFor="ticketLink" className="block text-lg font-medium mb-2 text-white">
              Ticket Link <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400">
                <FiLink />
              </div>
              <input
                id="ticketLink"
                type="url"
                className="w-full p-3 pl-10 bg-zinc-800 border border-cyan-900/50 rounded-lg text-white focus:border-cyan-500/70 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all"
                placeholder="Enter ticket link"
                value={ticketLink}
                onChange={(e) => setTicketLink(e.target.value)}
              />
            </div>
          </div>

          {/* Upload Flyer */}
          <div className="mb-6 relative z-10">
            <label htmlFor="flyer" className="block text-lg font-medium mb-2 text-white">
              Upload Flyer <span className="text-gray-400">(Optional)</span>
            </label>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-900/80 to-cyan-800/50 hover:from-cyan-800/80 hover:to-cyan-700/50 border border-cyan-600/30 rounded-md transition-all cursor-pointer group">
                <FiUpload className="text-cyan-400 group-hover:text-cyan-300" />
                <span className="text-white">{flyerFile ? 'Change Flyer' : 'Upload Flyer'}</span>
                <input
                  id="flyer"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFlyerChange}
                />
              </label>
              
              {flyerFile && (
                <button
                  type="button"
                  onClick={removeFlyerImage}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-red-500/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-md transition-all"
                >
                  <FiTrash2 />
                  <span>Remove</span>
                </button>
              )}
            </div>
            
            {flyerPreview ? (
              <div className="mt-4 relative">
                <div className="relative w-full h-[300px] rounded-lg overflow-hidden border border-cyan-900/30 bg-black/50">
                  <Image
                    src={flyerPreview}
                    alt="Flyer preview"
                    fill
                    style={{objectFit: "contain"}}
                    className="rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 w-full h-[150px] rounded-lg border border-dashed border-cyan-900/50 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FiPlus size={24} className="mx-auto mb-2" />
                  <p>Flyer preview will appear here</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <label className="text-white">Enable Reservations</label>
            <div className="relative inline-block w-12 h-6">
              <input
                type="checkbox"
                checked={reservationsEnabled}
                onChange={(e) => setReservationsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-500 transition-colors duration-200"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-6"></div>
            </div>
          </div>
        </div>

        {/* Create Event Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-gradient-to-r from-cyan-800 to-cyan-600 hover:from-cyan-700 hover:to-cyan-500 border border-cyan-500/50 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
        >
          <div className="absolute inset-0 flex justify-center items-center bg-gradient-to-r from-cyan-600/0 via-cyan-600/30 to-cyan-600/0 opacity-0 group-hover:opacity-100 transform translate-y-full group-hover:translate-y-0 transition-all duration-500"></div>
          <span className="relative z-10 flex items-center justify-center">
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Event...
              </>
            ) : (
              "Create Event"
            )}
          </span>
        </button>
      </form>
    </div>
  );
} 