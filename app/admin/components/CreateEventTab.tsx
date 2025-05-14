"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { uploadImageToStorage } from '@/lib/services/storage';
import { createEvent } from '@/lib/services/events';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { FiCalendar, FiLink, FiUpload, FiTrash2, FiPlus } from 'react-icons/fi';

export default function CreateEventTab() {
  const { user } = useAuth();
  const [eventName, setEventName] = useState('');
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [ticketLink, setTicketLink] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [reservationsEnabled, setReservationsEnabled] = useState(true);

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
      
      // Check if it's a valid image file
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Check file size
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        toast.error('Image file is too large (max 5MB)');
        return;
      }
      
      // Create preview URL
      const objectUrl = URL.createObjectURL(file);
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
    
    if (!user) {
      toast.error('You must be logged in to create an event.');
      return;
    }

    if (!validateForm()) {
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
          flyerUrl = await uploadImageToStorage(flyerFile, filePath);
        } catch (error) {
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
      toast.error('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="bg-zinc-900/50 rounded-lg border border-cyan-900/30 p-6">
          <form onSubmit={handleCreateEvent} className="space-y-6">
            {/* Event Name */}
            <div className="space-y-2">
              <label htmlFor="eventName" className="block text-sm font-medium text-gray-200">
                Event Name
              </label>
              <input
                type="text"
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full px-4 py-2 bg-black/50 border border-cyan-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-gray-500"
                placeholder="Enter event name"
              />
            </div>

            {/* Event Date */}
            <div className="space-y-2">
              <label htmlFor="eventDate" className="block text-sm font-medium text-gray-200">
                Event Date
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  id="eventDate"
                  value={selectedDate ? selectedDate.toISOString().slice(0, 16) : ''}
                  onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                  className="w-full px-4 py-2 bg-black/50 border border-cyan-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white"
                />
                <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Ticket Link */}
            <div className="space-y-2">
              <label htmlFor="ticketLink" className="block text-sm font-medium text-gray-200">
                Ticket Link (Optional)
              </label>
              <div className="relative">
                <input
                  type="url"
                  id="ticketLink"
                  value={ticketLink}
                  onChange={(e) => setTicketLink(e.target.value)}
                  className="w-full px-4 py-2 bg-black/50 border border-cyan-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-gray-500"
                  placeholder="https://"
                />
                <FiLink className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Reservations Toggle */}
            <div className="flex items-center space-x-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reservationsEnabled}
                  onChange={(e) => setReservationsEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
              <span className="text-sm font-medium text-gray-200">Enable Reservations</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg font-medium
                hover:from-cyan-500 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                  <span>Creating Event...</span>
                </>
              ) : (
                <>
                  <FiPlus className="w-5 h-5" />
                  <span>Create Event</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Flyer Upload Section */}
        <div className="bg-zinc-900/50 rounded-lg border border-cyan-900/30 p-6">
          <div className="h-full flex flex-col gap-6">
            {/* Upload Area */}
            <div 
              className={`${flyerPreview ? 'h-[200px]' : 'h-[400px]'} relative border-2 border-dashed border-cyan-900/30 rounded-lg hover:border-cyan-500/50 transition-colors cursor-pointer`}
              onClick={() => document.getElementById('flyerInput')?.click()}
            >
              <input
                id="flyerInput"
                type="file"
                accept="image/*"
                onChange={handleFlyerChange}
                className="hidden"
              />
              {!flyerPreview && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="p-6 rounded-full bg-cyan-900/20 mb-4">
                    <FiUpload className="h-12 w-12 text-cyan-400" />
                  </div>
                  <p className="text-lg text-gray-300 font-medium">
                    Click to upload a flyer
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    or drag and drop an image here
                  </p>
                  <p className="text-xs text-gray-600 mt-4">
                    Maximum file size: 5MB
                  </p>
                </div>
              )}
            </div>

            {/* Preview Area */}
            {flyerPreview && (
              <div className="flex-1 min-h-[500px] relative rounded-lg overflow-hidden bg-black/50">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src={flyerPreview}
                    alt="Event flyer preview"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute top-4 right-4 z-10">
                  <button
                    type="button"
                    onClick={removeFlyerImage}
                    className="p-3 bg-red-600/90 rounded-full text-white hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <FiTrash2 className="w-6 h-6" />
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-sm text-gray-300">
                    Click the trash icon to remove this image and upload a different one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 