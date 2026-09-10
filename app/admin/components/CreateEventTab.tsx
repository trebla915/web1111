"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { uploadImageToStorage } from '@/lib/services/storage';
import { createEvent } from '@/lib/services/events';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import { FiCalendar, FiLink, FiUpload, FiTrash2, FiPlus, FiCheck } from 'react-icons/fi';
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

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
        <h2 className="text-2xl lg:text-3xl font-bold text-accent-300">Create New Event</h2>
        <div className="text-sm text-fg-muted">Fill out the form below to create an event</div>
      </div>

      {/* Main Content - Mobile First Layout */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8">
        
        {/* Form Section - Takes full width on mobile, 8 cols on desktop */}
        <div className="lg:col-span-8">
          <Card padding="lg" className="bg-surface/50">
            <h3 className="text-lg font-semibold text-fg mb-6 flex items-center gap-2">
              <FiPlus className="text-accent-400" />
              Event Details
            </h3>
            
            <form onSubmit={handleCreateEvent} className="space-y-6">
              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="eventName">
                  Event Name *
                </Label>
                <Input
                  type="text"
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="px-4 py-3 lg:py-2 bg-canvas/50 border border-accent-900/30 focus:ring-2 focus:ring-accent-500/50 placeholder-fg-subtle text-base lg:text-sm"
                  placeholder="Enter event name"
                />
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <Label htmlFor="eventDate">
                  Event Date *
                </Label>
                <div className="relative">
                  <Input
                    type="date"
                    id="eventDate"
                    value={selectedDate ? selectedDate.toISOString().slice(0, 10) : ''}
                    onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value + 'T00:00:00') : null)}
                    className="px-4 py-3 lg:py-2 bg-canvas/50 border border-accent-900/30 focus:ring-2 focus:ring-accent-500/50 text-base lg:text-sm"
                  />
                  <FiCalendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fg-muted pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="px-4 py-3 lg:py-2 bg-canvas/50 border border-accent-900/30 focus:ring-2 focus:ring-accent-500/50 placeholder-fg-subtle text-base lg:text-sm resize-none"
                  placeholder="Notes about the event..."
                />
              </div>

              {/* Ticket Link */}
              <div className="space-y-2">
                <Label htmlFor="ticketLink">
                  Ticket Link (Optional)
                </Label>
                <div className="relative">
                  <Input
                    type="url"
                    id="ticketLink"
                    value={ticketLink}
                    onChange={(e) => setTicketLink(e.target.value)}
                    className="px-4 py-3 lg:py-2 bg-canvas/50 border border-accent-900/30 focus:ring-2 focus:ring-accent-500/50 placeholder-fg-subtle text-base lg:text-sm"
                    placeholder="https://tickets.example.com"
                  />
                  <FiLink className="absolute right-3 top-1/2 transform -translate-y-1/2 text-fg-muted pointer-events-none" />
                </div>
              </div>

              {/* Reservations Toggle - Mobile Optimized */}
              <div className="bg-surface-raised/50 p-4 rounded-lg border border-accent-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-fg-dim">Enable Reservations</h4>
                    <p className="text-xs text-fg-muted mt-1">Allow users to book tables for this event</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reservationsEnabled}
                      onChange={(e) => setReservationsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-hover peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-fg after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-fg after:border-fg-dim after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
                  </label>
                </div>
              </div>

              {/* Submit Button - Mobile Optimized */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="ghost" size="lg" full className="px-6 py-4 lg:py-3 bg-gradient-to-r from-accent-600 to-accent-700 text-base lg:text-sm hover:from-accent-500 hover:to-accent-600 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="text-fg h-5 w-5" />
                      Creating Event...
                    </>
                  ) : (
                    <>
                      <FiCheck size={20} />
                      Create Event
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Flyer Upload Section - Full width on mobile, 4 cols on desktop */}
        <div className="lg:col-span-4">
          <Card padding="lg" className="bg-surface/50">
            <h3 className="text-lg font-semibold text-fg mb-6 flex items-center gap-2">
              <FiUpload className="text-accent-400" />
              Event Flyer
            </h3>
            
            {/* Flyer Upload Area */}
            {!flyerPreview ? (
              <div className="border-2 border-dashed border-accent-900/30 rounded-lg p-8 text-center hover:border-accent-700/50 transition-colors">
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-accent-900/20 rounded-full flex items-center justify-center">
                    <FiUpload className="text-accent-400" size={24} />
                  </div>
                  <div>
                    <h4 className="text-fg font-medium">Upload Event Flyer</h4>
                    <p className="text-fg-muted text-sm mt-1">PNG, JPG up to 5MB</p>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFlyerChange}
                      className="hidden"
                    />
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-700 text-fg rounded-lg transition-colors text-sm">
                      <FiPlus size={16} />
                      Choose File
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Flyer Preview */}
                <div className="relative bg-canvas/50 rounded-lg overflow-hidden border border-accent-900/30">
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
                  <Button
                    type="button"
                    onClick={removeFlyerImage}
                    variant="ghost" size="md" className="flex-1 px-4 py-2 bg-danger-900/20 hover:bg-danger-900/40 border border-danger-500/40 text-danger-400 flex items-center justify-center gap-2 text-sm"
                  >
                    <FiTrash2 size={16} />
                    Remove
                  </Button>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFlyerChange}
                      className="hidden"
                    />
                    <div className="w-full px-4 py-2 bg-accent-600 hover:bg-accent-700 text-fg rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                      <FiUpload size={16} />
                      Change
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Upload Tips */}
            <div className="mt-6 p-3 bg-surface-raised/50 rounded-lg border border-accent-900/20">
              <h4 className="text-xs font-medium text-accent-300 mb-2">Tips:</h4>
              <ul className="text-xs text-fg-muted space-y-1">
                <li>• Use high-quality images for best results</li>
                <li>• Recommended size: 1080x1350px</li>
                <li>• File formats: JPG, PNG</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 