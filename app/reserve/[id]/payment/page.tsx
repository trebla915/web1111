"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useReservation } from '@/components/providers/ReservationProvider';
import { PaymentService } from '@/lib/services/payment';
import { createReservation } from '@/lib/services/reservations';
import { toast } from 'react-hot-toast';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { FiCreditCard, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

// Initialize Stripe with error handling
const stripePromise = (async () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
  if (!publishableKey) {
    throw new Error('Stripe publishable key is not configured');
  }
  return loadStripe(publishableKey);
})();

function PaymentForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/reserve/${window.location.pathname.split('/')[1]}/confirmation`,
        },
      });

      if (submitError) {
        setError(submitError.message || 'An error occurred during payment');
      } else {
        onSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-white/30 rounded-lg bg-transparent">
        <PaymentElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#FFFFFF',
                '::placeholder': {
                  color: '#AAAAAA'
                },
              },
              invalid: {
                color: '#FF4D4D',
              },
            }
          }}
        />
      </div>
      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-3 bg-cyan-600 text-white rounded-lg font-bold transition-all hover:bg-cyan-700 disabled:bg-cyan-900 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { reservationDetails, clearReservationDetails } = useReservation();
  
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    // Check for Stripe configuration error
    stripePromise.catch((err) => {
      console.error('Stripe initialization error:', err);
      setStripeError('Payment system is not properly configured. Please try again later.');
    });
  }, []);

  useEffect(() => {
    const initializePayment = async () => {
      if (!reservationDetails || !user) {
        setError('No reservation details or user information found');
        return;
      }

      try {
        setLoading(true);
        const total = calculateTotal();

        // Prepare metadata and reservation details
        const metadata = {
          name: user.displayName || 'Guest',
          email: user.email || '',
          eventName: reservationDetails.eventName,
          tableNumber: reservationDetails.tableNumber.toString(),
          guests: reservationDetails.guestCount.toString()
        };

        const paymentReservationDetails = {
          userId: user.uid,
          eventId: params.id as string,
          tableId: reservationDetails.tableId,
          reservationId: reservationDetails.reservationId || params.id
        };

        const { clientSecret } = await PaymentService.createPaymentIntent(
          total,
          metadata,
          paymentReservationDetails
        );
        setClientSecret(clientSecret);
      } catch (err) {
        console.error('Error initializing payment:', err);
        setError('Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [reservationDetails, user, params.id]);

  const calculateTotal = () => {
    if (!reservationDetails) return 0;
    
    const bottlesCost = (reservationDetails.bottles || []).reduce((total, bottle) => {
      return total + (bottle.price || 0);
    }, 0);

    const mixersCost = (reservationDetails.mixers || []).reduce((total, mixer) => {
      return total + (mixer.price || 0);
    }, 0);

    const subtotal = (reservationDetails.tablePrice || 0) + bottlesCost + mixersCost;
    const serviceFee = subtotal * 0.1; // 10% service fee
    return subtotal + serviceFee;
  };

  const handlePaymentSuccess = async () => {
    try {
      if (!reservationDetails || !user) {
        toast.error('Missing reservation details or user information');
        return;
      }

      // Create the reservation
      const reservation = await createReservation({
        eventId: params.id as string,
        eventName: reservationDetails.eventName,
        tableId: reservationDetails.tableId,
        tableNumber: reservationDetails.tableNumber,
        tablePrice: reservationDetails.tablePrice,
        capacity: reservationDetails.capacity,
        guestCount: reservationDetails.guestCount,
        userId: user.uid,
        userEmail: user.email || '',
        userName: user.displayName || '',
        bottles: reservationDetails.bottles || [],
        mixers: reservationDetails.mixers || [],
        reservationTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        eventDate: reservationDetails.eventDate
      });

      // Clear reservation details and redirect to confirmation
      clearReservationDetails();
      router.push(`/reserve/${params.id}/confirmation`);
    } catch (err) {
      console.error('Error creating reservation:', err);
      toast.error('Failed to create reservation');
    }
  };

  if (!reservationDetails) {
    return (
      <div className="min-h-screen pt-28 pb-12 flex flex-col items-center">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <FiAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No Reservation Details</h2>
              <p className="text-zinc-400 mb-4">Please start the reservation process again.</p>
              <button
                onClick={() => router.push(`/reserve/${params.id}`)}
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const costBreakdown = PaymentService.formatCostBreakdown(
    reservationDetails.tablePrice,
    reservationDetails.bottles || [],
    reservationDetails.mixers || []
  );

  return (
    <div className="min-h-screen pt-28 pb-12 flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Reservation Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Your Reservation
          </h1>
          <p className="text-cyan-400">
            {reservationDetails.eventName} - {new Date(reservationDetails.eventDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 overflow-hidden">
          {/* Cost Breakdown */}
          <div className="p-6 border-b border-cyan-900/30">
            <h2 className="text-xl font-bold text-white mb-4">Cost Breakdown</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Table</span>
                <span className="text-white">${costBreakdown.tablePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Bottles</span>
                <span className="text-white">${costBreakdown.bottlesCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Mixers</span>
                <span className="text-white">${costBreakdown.mixersCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Service Fee (10%)</span>
                <span className="text-white">${costBreakdown.serviceFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-zinc-700 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-bold text-cyan-400">${costBreakdown.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
              </div>
            ) : clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <div className="mt-6">
                  <h2 className="text-xl font-bold text-white mb-4">Payment Method</h2>
                  <PaymentForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
                </div>
              </Elements>
            ) : null}

            {(error || stripeError) && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex">
                  <FiAlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-400">Error</h3>
                    <div className="mt-2 text-sm text-red-400">
                      <p>{error || stripeError}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 