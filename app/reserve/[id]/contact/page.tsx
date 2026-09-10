"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useReservation } from '@/components/providers/ReservationProvider';
import { toast } from 'react-hot-toast';
import { FiUser, FiPhone, FiMail, FiArrowLeft } from 'react-icons/fi';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";
import { RouteLoading } from "@/components/ui/page-state";
import { ReservationStepHeader } from "@/components/reservation/ReservationSteps";
import { Input } from "@/components/ui/input";

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
    return <RouteLoading message="Checking your account…" />;
  }

  if (!reservationDetails) {
    return <RouteLoading message="Loading your reservation…" />;
  }

  return (
    <div className="flex min-h-dvh flex-col pt-24 pb-16 sm:pt-28">
      <div className="mx-auto w-full max-w-2xl px-4">
        <Button onClick={handleGoBack} variant="ghost" size="md" className="mb-4 -ml-4">
          <FiArrowLeft aria-hidden="true" size={18} />
          Back to details
        </Button>

        {/* Three headings stacked here — "Contact Information", then "Please
            provide your contact details", then a paragraph restating both —
            all saying the same thing at three sizes. */}
        <ReservationStepHeader
          step="contact"
          eventName={reservationDetails.eventName}
          eventDate={formatDate(reservationDetails.eventDate)}
          title="Your contact details"
          description={`Table ${reservationDetails.tableNumber} for ${reservationDetails.guestCount} ${
            reservationDetails.guestCount === 1 ? 'guest' : 'guests'
          }. We'll send your confirmation and any updates here.`}
        />

        {/* Contact Form */}
        <div className="overflow-hidden rounded-lg border border-line-accent/30 bg-surface">
          <div className="space-y-5 p-4 sm:p-6">
            {/* Each field re-declared the input recipe by hand, with a focus
                ring in `--fg` where the rest of the site rings in `--accent`,
                and the validation errors were never tied to their input, so a
                screen reader announced the field as valid and unlabelled while
                a red sentence sat underneath it. */}
            <div>
              <Label htmlFor="name" className="mb-1.5">
                Full name
              </Label>
              <Input
                type="text"
                id="name"
                autoComplete="name"
                required
                leadingIcon={<FiUser aria-hidden="true" className="h-4 w-4" />}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Alex Navarro"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" role="alert" className="mt-1.5 text-sm text-danger-bright">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email" className="mb-1.5">
                Email address
              </Label>
              <Input
                type="email"
                id="email"
                autoComplete="email"
                required
                leadingIcon={<FiMail aria-hidden="true" className="h-4 w-4" />}
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="you@example.com"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1.5 text-sm text-danger-bright">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phone" className="mb-1.5">
                Phone number
              </Label>
              <Input
                type="tel"
                id="phone"
                autoComplete="tel"
                required
                leadingIcon={<FiPhone aria-hidden="true" className="h-4 w-4" />}
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(915) 555-0142"
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errors.phone ? 'phone-error' : 'phone-hint'}
              />
              {errors.phone ? (
                <p id="phone-error" role="alert" className="mt-1.5 text-sm text-danger-bright">
                  {errors.phone}
                </p>
              ) : (
                <p id="phone-hint" className="mt-1.5 text-xs text-fg-subtle">
                  Only used to reach you about this reservation.
                </p>
              )}
            </div>

            <p className="rounded-lg bg-surface-raised p-4 text-sm text-fg-muted">
              <strong className="font-medium text-fg-dim">Privacy:</strong> your details are used for
              this reservation and event updates only. We don't share them or use them for marketing.
            </p>
          </div>

          {/* Actions */}
          <div className="border-t border-line-subtle p-4 sm:p-6">
            <Button
              onClick={handleContinueToPayment}
              disabled={isSubmitting}
              loading={isSubmitting}
              variant="primary"
              size="lg"
              full
            >
              {isSubmitting ? 'Saving' : 'Continue to payment'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 