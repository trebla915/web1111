"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { uploadImageToStorage } from '@/lib/services/storage';
import { createEvent } from '@/lib/services/events';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { FiCalendar, FiLink, FiUpload, FiTrash2, FiPlus, FiCheck } from 'react-icons/fi';

export default function CreateEventTab() {
  const { user } = useAuth();
  const [eventName, setEventName] = useState('');
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [ticketLink, setTicketLink] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
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
        ...(description.trim() && { description: description.trim() }),
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
      setDescription('');
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
    <div className="space-y-6">
      {/* Mobile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl lg:text-3xl font-bold text-cyan-300">Create New Event</h2>
        <div className="text-sm text-gray-400">Fill out the form below to create an event</div>
      </div>

      {/* Main Content - Mobile First Layout */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8">
        
        {/* Form Section - Takes full width on mobile, 8 cols on desktop */}
        <div className="lg:col-span-8">
          <div className="bg-zinc-900/50 rounded-lg border border-cyan-900/30 p-4 lg:p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <FiPlus className="text-cyan-400" />
              Event Details
            </h3>
            
            <form onSubmit={handleCreateEvent} className="space-y-6">
              {/* Event Name */}
              <div className="space-y-2">
                <label htmlFor="eventName" className="block text-sm font-medium text-gray-200">
                  Event Name *
                </label>
                <input
                  type="text"
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full px-4 py-3 lg:py-2 bg-black/50 border border-cyan-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-gray-500 text-base lg:text-sm"
                  placeholder="Enter event name"
                />
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-200">
                  Event Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="eventDate"
                    value={selectedDate ? selectedDate.toISOString().slice(0, 10) : ''}
                    onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)}
                    className="w-full px-4 py-3 lg:py-2 bg-black/50 border border-cyan-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white text-base lg:text-sm"
                  />
                  <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-200">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 lg:py-2 bg-black/50 border border-cyan-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-gray-500 text-base lg:text-sm resize-none"
                  placeholder="Notes about the event..."
                />
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
                    className="w-full px-4 py-3 lg:py-2 bg-black/50 border border-cyan-900/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-gray-500 text-base lg:text-sm"
                    placeholder="https://tickets.example.com"
                  />
                  <FiLink className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Reservations Toggle - Mobile Optimized */}
              <div className="bg-zinc-800/50 p-4 rounded-lg border border-cyan-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-200">Enable Reservations</h4>
                    <p className="text-xs text-gray-400 mt-1">Allow users to book tables for this event</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reservationsEnabled}
                      onChange={(e) => setReservationsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
              </div>

              {/* Submit Button - Mobile Optimized */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 lg:py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-lg font-medium text-base lg:text-sm
                    hover:from-cyan-500 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                      Creating Event...
                    </>
                  ) : (
                    <>
                      <FiCheck size={20} />
                      Create Event
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Flyer Upload Section - Full width on mobile, 4 cols on desktop */}
        <div className="lg:col-span-4">
          <div className="bg-zinc-900/50 rounded-lg border border-cyan-900/30 p-4 lg:p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <FiUpload className="text-cyan-400" />
              Event Flyer
            </h3>
            
            {/* Flyer Upload Area */}
            {!flyerPreview ? (
              <div className="border-2 border-dashed border-cyan-900/30 rounded-lg p-8 text-center hover:border-cyan-700/50 transition-colors">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-cyan-900/20 rounded-full flex items-center justify-center">
                    <FiUpload className="text-cyan-400" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Upload Event Flyer</h4>
                    <p className="text-gray-400 text-sm mt-1">PNG, JPG up to 5MB</p>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFlyerChange}
                      className="hidden"
                    />
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm">
                      <FiPlus size={16} />
                      Choose File
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Flyer Preview */}
                <div className="relative bg-black/50 rounded-lg overflow-hidden border border-cyan-900/30">
                  <Image
                    src={flyerPreview}
                    alt="Event flyer preview"
                    width={300}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                </div>
                
                {/* Flyer Actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={removeFlyerImage}
                    className="flex-1 px-4 py-2 bg-red-900/20 hover:bg-red-900/40 border border-red-500/40 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <FiTrash2 size={16} />
                    Remove
                  </button>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFlyerChange}
                      className="hidden"
                    />
                    <div className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                      <FiUpload size={16} />
                      Change
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Upload Tips */}
            <div className="mt-6 p-3 bg-zinc-800/50 rounded-lg border border-cyan-900/20">
              <h4 className="text-xs font-medium text-cyan-300 mb-2">Tips:</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                <li>• Use high-quality images for best results</li>
                <li>• Recommended size: 1080x1350px</li>
                <li>• File formats: JPG, PNG</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 