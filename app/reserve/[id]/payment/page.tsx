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
import { User } from '@/types/user';

// Initialize Stripe with error handling
const stripePromise = (async () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
  if (!publishableKey) {
    throw new Error('Stripe publishable key is not configured');
  }
  return loadStripe(publishableKey);
})();

function PaymentForm({ clientSecret, onSuccess, user }: { 
  clientSecret: string; 
  onSuccess: () => void;
  user: User | null;
}) {
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
            layout: 'tabs',
            defaultValues: {
              billingDetails: {
                name: user?.displayName || undefined,
                email: user?.email || undefined
              }
            },
            business: {
              name: '1111'
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

        // Create the reservation first
        const reservation = await createReservation({
          eventId: params.id as string,
          userId: user.uid,
          tableNumber: reservationDetails.tableNumber,
          guestCount: reservationDetails.guestCount,
          bottles: reservationDetails.bottles?.map(bottle => ({
            id: bottle.id,
            name: bottle.name
          })) || [],
          totalAmount: total,
          status: 'pending',
          createdAt: new Date().toISOString()
        });

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
          tableId: reservationDetails.tableId
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

    // Calculate taxable subtotal (everything except gratuity and processing fee)
    const taxableSubtotal = (reservationDetails.tablePrice || 0) + bottlesCost + mixersCost;
    
    // Calculate sales tax (8.25%)
    const salesTax = taxableSubtotal * 0.0825;
    
    // Calculate gratuity (18% on bottles only)
    const gratAmount = bottlesCost * 0.18;
    
    // Calculate subtotal including tax and gratuity
    const subtotal = taxableSubtotal + salesTax + gratAmount;
    
    // Calculate Stripe fee (2.9% + $0.30)
    const stripeFee = (subtotal * 0.029) + 0.30;
    
    return subtotal + stripeFee;
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
        userId: user.uid,
        tableNumber: reservationDetails.tableNumber,
        guestCount: reservationDetails.guestCount,
        bottles: reservationDetails.bottles?.map(bottle => ({
          id: bottle.id,
          name: bottle.name
        })) || [],
        totalAmount: calculateTotal(),
        status: 'pending',
        createdAt: new Date().toISOString()
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

  const costBreakdown = (() => {
    if (!reservationDetails) return {
      tablePrice: 0,
      bottlesCost: 0,
      mixersCost: 0,
      gratAmount: 0,
      salesTax: 0,
      stripeFee: 0,
      subtotal: 0,
      total: 0
    };

    const tablePrice = reservationDetails.tablePrice || 0;
    const bottles = reservationDetails.bottles || [];
    const mixers = reservationDetails.mixers || [];
    
    // Calculate costs
    const bottlesCost = bottles.reduce((total, bottle) => total + (bottle.price || 0), 0);
    const mixersCost = mixers.reduce((total, mixer) => total + (mixer.price || 0), 0);
    
    // Calculate taxable subtotal (everything except gratuity and processing fee)
    const taxableSubtotal = tablePrice + bottlesCost + mixersCost;
    
    // Calculate sales tax (8.25%)
    const salesTax = taxableSubtotal * 0.0825;
    
    // Calculate gratuity (18% on bottles only)
    const gratAmount = bottlesCost * 0.18;
    
    // Calculate subtotal including tax and gratuity
    const subtotal = taxableSubtotal + salesTax + gratAmount;
    
    // Calculate Stripe fee (2.9% + $0.30)
    const stripeFee = (subtotal * 0.029) + 0.30;
    
    // Calculate final total
    const total = subtotal + stripeFee;

    return {
      tablePrice,
      bottlesCost,
      mixersCost,
      salesTax,
      gratAmount,
      stripeFee,
      subtotal,
      total
    };
  })();

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

        {/* Cost Breakdown */}
        <div className="mb-8 bg-zinc-900 rounded-lg border border-cyan-900/30 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Cost Breakdown</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">Table Price:</span>
              <span className="text-white">${costBreakdown.tablePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Bottles:</span>
              <span className="text-white">${costBreakdown.bottlesCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Mixers:</span>
              <span className="text-white">${costBreakdown.mixersCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Sales Tax (8.25%):</span>
              <span className="text-white">${costBreakdown.salesTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Gratuity (18% on bottles):</span>
              <span className="text-white">${costBreakdown.gratAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Processing Fee (2.9% + $0.30):</span>
              <span className="text-white">${costBreakdown.stripeFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Subtotal:</span>
              <span className="text-white">${costBreakdown.subtotal.toFixed(2)}</span>
            </div>
            <div className="border-t border-zinc-700 pt-2 mt-2 flex justify-between font-bold">
              <span className="text-white">Total:</span>
              <span className="text-cyan-400">${costBreakdown.total.toFixed(2)}</span>
            </div>
            <div className="mt-4 text-sm text-zinc-500">
              <p>* A card processing fee of 2.9% + $0.30 is applied to all transactions to cover payment processing costs.</p>
              <p className="mt-2">* Please note: an automatic 18% gratuity is applied to all bottle purchases at checkout.</p>
              <p className="mt-2">* Sales tax of 8.25% is applied to all purchases except gratuity and processing fees.</p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Payment Details</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
            </div>
          ) : error || stripeError ? (
            <div className="text-center py-8">
              <FiAlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-400 mb-4">{error || stripeError}</p>
              <button
                onClick={() => router.push(`/reserve/${params.id}`)}
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm 
                clientSecret={clientSecret} 
                onSuccess={handlePaymentSuccess}
                user={user}
              />
            </Elements>
          ) : null}
        </div>
      </div>
    </div>
  );
} 