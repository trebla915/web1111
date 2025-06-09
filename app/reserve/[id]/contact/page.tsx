"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useReservation } from '@/components/providers/ReservationProvider';
import { toast } from 'react-hot-toast';
import { FiUser, FiPhone, FiMail, FiArrowLeft } from 'react-icons/fi';

export default function ContactInformationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { reservationDetails, updateReservationDetails } = useReservation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const eventId = params.id as string;
  
  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth state to be determined
    }
    
    if (!user) {
      toast.error('You need an account to reserve a table');
      router.push('/auth/login');
      return;
    }
    
    if (!reservationDetails) {
      router.push(`/reserve/${eventId}`);
      return;
    }
    
    // Pre-populate form with existing data
    setFormData({
      name: reservationDetails.userName || user.displayName || '',
      email: reservationDetails.userEmail || user.email || '',
      phone: reservationDetails.userPhone || ''
    });
  }, [eventId, reservationDetails, router, user, authLoading]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate phone
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (cleanPhone.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleContinueToPayment = async () => {
    if (!validateForm()) {
      toast.error('Please correct the errors below');
      return;
    }
    
    if (!reservationDetails) {
      toast.error('Reservation details not found');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update reservation details with contact information
      updateReservationDetails({
        userName: formData.name.trim(),
        userEmail: formData.email.trim(),
        userPhone: formData.phone.trim()
      });

      toast.success('Contact information saved');
      router.push(`/reserve/${eventId}/payment`);
    } catch (error) {
      console.error('Error saving contact information:', error);
      toast.error('Failed to save contact information');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    router.push(`/reserve/${eventId}/details`);
  };

  // Format date to a more readable format
  const formatDate = (dateStr: string): string => {
    try {
      if (!dateStr) return 'Date TBA';
      
      const [datePart] = dateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      
      const date = new Date(year, month - 1, day);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };
  
  // Show loading state while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen pt-28 pb-12 flex flex-col items-center">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-white">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!reservationDetails) {
    return (
      <div className="min-h-screen pt-28 pb-12 flex flex-col items-center">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="h-64 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-white">Loading your reservation...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-12 flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Back button */}
        <button
          onClick={handleGoBack}
          className="mb-6 flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <FiArrowLeft className="mr-2" size={20} />
          Back to Details
        </button>

        {/* Reservation Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Contact Information
          </h1>
          <p className="text-cyan-400">
            {reservationDetails.eventName} - {formatDate(reservationDetails.eventDate)}
          </p>
          <p className="text-zinc-400 mt-2">
            Table {reservationDetails.tableNumber} for {reservationDetails.guestCount} {reservationDetails.guestCount === 1 ? 'person' : 'people'}
          </p>
        </div>
        
        {/* Contact Form */}
        <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-white mb-6">Please provide your contact details</h2>
            <p className="text-zinc-400 mb-6">
              This information will be used for your reservation confirmation and any important updates about your event.
            </p>
            
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-4 py-3 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-zinc-600'
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter your email address"
                    className={`w-full pl-10 pr-4 py-3 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-zinc-600'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-white mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className={`w-full pl-10 pr-4 py-3 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-zinc-600'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
                )}
                <p className="mt-1 text-xs text-zinc-500">
                  We'll use this number to contact you about your reservation
                </p>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="mt-6 p-4 bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-400">
                <strong className="text-white">Privacy:</strong> Your contact information will only be used for this reservation and important event updates. We will not share your information with third parties or use it for marketing purposes.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-zinc-700">
            <button
              onClick={handleContinueToPayment}
              disabled={isSubmitting}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-900 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Continue to Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 