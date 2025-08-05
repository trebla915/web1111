"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useReservation } from '@/components/providers/ReservationProvider';
import { PaymentService } from '@/lib/services/payment';
import { toast } from 'react-hot-toast';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { FiCreditCard, FiCheckCircle, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';
import { User } from '@/types/user';

// Initialize Stripe with error handling
const stripePromise = (async () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
  if (!publishableKey) {
    throw new Error('Stripe publishable key is not configured');
  }
  return loadStripe(publishableKey);
})();

function PaymentForm({ clientSecret, onSuccess, user, reservationDetails }: { 
  clientSecret: string; 
  onSuccess: () => void;
  user: User | null;
  reservationDetails: any;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check bottle minimum for this form
  const checkBottleMinimum = () => {
    if (!reservationDetails) return { met: false, required: 0, current: 0 };
    
    const required = reservationDetails.minimumBottles || 0;
    const current = (reservationDetails.bottles || []).length;
    
    return {
      met: current >= required,
      required,
      current,
    };
  };

  const bottleRequirement = checkBottleMinimum();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    // Validate bottle minimum before payment
    if (!bottleRequirement.met) {
      setError(`Table ${reservationDetails?.tableNumber} requires a minimum of ${bottleRequirement.required} bottle${bottleRequirement.required > 1 ? 's' : ''}. You currently have ${bottleRequirement.current}.`);
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
                name: reservationDetails?.userName || user?.displayName || undefined,
                email: reservationDetails?.userEmail || user?.email || undefined
              }
            },
            business: {
              name: '1111'
            }
          }}
        />
      </div>
      {!bottleRequirement.met && (
        <div className="text-yellow-400 text-sm bg-yellow-900/20 border border-yellow-900/30 rounded-lg p-3">
          ⚠️ Table {reservationDetails?.tableNumber} requires a minimum of {bottleRequirement.required} bottle{bottleRequirement.required > 1 ? 's' : ''}. 
          You currently have {bottleRequirement.current}. Please go back and add more bottles.
        </div>
      )}
      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing || !bottleRequirement.met}
        className={`w-full py-3 font-bold rounded-lg transition-all ${
          !bottleRequirement.met 
            ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
            : 'bg-cyan-600 hover:bg-cyan-700 text-white disabled:bg-cyan-900 disabled:cursor-not-allowed'
        }`}
      >
        {isProcessing ? 'Processing...' : bottleRequirement.met ? 'Pay Now' : `Add ${bottleRequirement.required - bottleRequirement.current} More Bottle${(bottleRequirement.required - bottleRequirement.current) > 1 ? 's' : ''}`}
      </button>
    </form>
  );
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { reservationDetails, clearReservationDetails } = useReservation();
  
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast.error('You need an account to make a reservation');
      router.push('/auth/login');
      return;
    }

    if (!reservationDetails) {
      router.push(`/reserve/${params.id}`);
      return;
    }
  }, [user, authLoading, reservationDetails, router, params.id]);

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
        const total = costBreakdown.total;

        // Prepare comprehensive metadata for the payment
        const metadata = {
          // Customer Information
          name: reservationDetails.userName || user.displayName || 'Guest',
          email: reservationDetails.userEmail || user.email || '',
          phone: reservationDetails.userPhone || '',
          
          // Event Information
          eventName: reservationDetails.eventName,
          eventId: params.id as string,
          eventDate: reservationDetails.eventDate || '',
          
          // Table Information
          tableNumber: reservationDetails.tableNumber.toString(),
          tableId: reservationDetails.tableId,
          tablePrice: reservationDetails.tablePrice?.toString() || '0',
          
          // Reservation Details
          guests: reservationDetails.guestCount.toString(),
          reservationTime: reservationDetails.reservationTime || new Date().toISOString(),
          
          // Bottle & Mixer Information
          bottleCount: (reservationDetails.bottles?.length || 0).toString(),
          bottlesOrdered: reservationDetails.bottles?.map(bottle => `${bottle.name} ($${bottle.price})`).join(', ') || 'None',
          bottlesCost: (reservationDetails.bottles || []).reduce((total, bottle) => total + (bottle.price || 0), 0).toString(),
          
          mixerCount: (reservationDetails.mixers?.length || 0).toString(),
          mixersOrdered: reservationDetails.mixers?.map(mixer => `${mixer.name} ($${mixer.price})`).join(', ') || 'None',
          mixersCost: (reservationDetails.mixers || []).reduce((total, mixer) => total + (mixer.price || 0), 0).toString(),
          
          // Financial Information
          subtotal: (reservationDetails.tablePrice + 
                    (reservationDetails.bottles || []).reduce((total, bottle) => total + (bottle.price || 0), 0) +
                    (reservationDetails.mixers || []).reduce((total, mixer) => total + (mixer.price || 0), 0)).toString(),
          totalAmount: total.toString(),
          
          // System Information
          userId: user.uid,
          platform: 'web',
          source: '1111web'
        };

        // Create payment intent - convert to cents for Stripe
        const { clientSecret, paymentId } = await PaymentService.createPaymentIntent(
          Math.round(total * 100), // Convert to cents
          metadata,
          {
            userId: user.uid,
            eventId: params.id as string,
            tableId: reservationDetails.tableId,
          }
        );

        if (!clientSecret) {
          throw new Error('Failed to get client secret from payment intent');
        }

        setClientSecret(clientSecret);
      } catch (err) {
        console.error('Error initializing payment:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize payment';
        setError(errorMessage);
        toast.error(errorMessage);
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

      // Extract payment ID from client secret
      const paymentIntentId = clientSecret!.split('_secret_')[0];
      
      // Poll for reservation creation (backend webhook will create it)
      const maxAttempts = 30; // 30 seconds max wait
      const pollInterval = 1000; // 1 second intervals
      let attempts = 0;
      
      toast.loading('Processing your reservation...', { id: 'reservation-processing' });
      
      const pollForReservation = async (): Promise<boolean> => {
        try {
          // Check if reservation was created by checking payment status
          const response = await fetch(`/api/payments/${paymentIntentId}/status`);
          if (response.ok) {
            const paymentData = await response.json();
            if (paymentData.reservationCreated) {
              return true;
            }
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            return pollForReservation();
          }
          return false;
        } catch (error) {
          console.error('Error polling for reservation:', error);
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            return pollForReservation();
          }
          return false;
        }
      };

      const reservationCreated = await pollForReservation();
      
      toast.dismiss('reservation-processing');
      
      if (reservationCreated) {
        toast.success('Reservation confirmed!');
        clearReservationDetails();
        router.push(`/reserve/${params.id}/confirmation?paymentId=${paymentIntentId}`);
      } else {
        toast.error('Reservation processing is taking longer than expected. Please check your reservations or contact support.');
        // Still redirect but with a warning
        clearReservationDetails();
        router.push(`/reserve/${params.id}/confirmation?paymentId=${paymentIntentId}&status=pending`);
      }
    } catch (err) {
      console.error('Error handling payment success:', err);
      toast.error('Payment succeeded but reservation processing failed. Please contact support.');
    }
  };

  const handlePayment = async () => {
    if (!reservationDetails) {
      toast.error('Reservation details not found');
      return;
    }

    setIsProcessing(true);
    try {
      // Initialize payment if not already done
      if (!clientSecret) {
        const total = costBreakdown.total;
        
        const metadata = {
          name: reservationDetails.userName || user?.displayName || 'Guest',
          email: reservationDetails.userEmail || user?.email || '',
          phone: reservationDetails.userPhone || '',
          eventName: reservationDetails.eventName,
          eventId: params.id as string,
          eventDate: reservationDetails.eventDate || '',
          tableNumber: reservationDetails.tableNumber.toString(),
          tableId: reservationDetails.tableId,
          tablePrice: reservationDetails.tablePrice?.toString() || '0',
          guests: reservationDetails.guestCount.toString(),
          reservationTime: reservationDetails.reservationTime || new Date().toISOString(),
          bottleCount: (reservationDetails.bottles?.length || 0).toString(),
          bottlesOrdered: reservationDetails.bottles?.map(bottle => `${bottle.name} ($${bottle.price})`).join(', ') || 'None',
          bottlesCost: (reservationDetails.bottles || []).reduce((total, bottle) => total + (bottle.price || 0), 0).toString(),
          mixerCount: (reservationDetails.mixers?.length || 0).toString(),
          mixersOrdered: reservationDetails.mixers?.map(mixer => `${mixer.name} ($${mixer.price})`).join(', ') || 'None',
          mixersCost: (reservationDetails.mixers || []).reduce((total, mixer) => total + (mixer.price || 0), 0).toString(),
          subtotal: (reservationDetails.tablePrice + 
                    (reservationDetails.bottles || []).reduce((total, bottle) => total + (bottle.price || 0), 0) +
                    (reservationDetails.mixers || []).reduce((total, mixer) => total + (mixer.price || 0), 0)).toString(),
          totalAmount: total.toString(),
          userId: user?.uid,
          platform: 'web',
          source: '1111web'
        };

        const { clientSecret: newClientSecret, paymentId } = await PaymentService.createPaymentIntent(
          Math.round(total * 100), // Convert to cents
          metadata,
          {
            userId: user?.uid || '',
            eventId: params.id as string,
            tableId: reservationDetails.tableId,
          }
        );

        setClientSecret(newClientSecret);
      }

      // Show payment form
      if (clientSecret) {
        // The payment form will be rendered below
      } else {
        toast.error('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTestModePayment = async () => {
    if (!reservationDetails) {
      toast.error('Reservation details not found');
      return;
    }

    setIsProcessing(true);
    try {
      // Get the auth token from Firebase
      const token = await user?.auth?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/payments/test-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: params.id,
          tableId: reservationDetails.tableId,
          amount: costBreakdown.total,
          guestCount: reservationDetails.guestCount,
          bottles: reservationDetails.bottles,
          userName: reservationDetails.userName,
          userEmail: reservationDetails.userEmail,
          userPhone: reservationDetails.userPhone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process test payment');
      }

      const data = await response.json();
      router.push(`/reserve/${params.id}/confirmation?paymentId=${data.paymentId}&status=test`);
    } catch (error: any) {
      console.error('Error processing test payment:', error);
      toast.error(error.message || 'Failed to process test payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoBack = () => {
    router.push(`/reserve/${params.id}/contact`);
  };

  if (loading || !reservationDetails) {
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

  const costBreakdown = (() => {
    console.log('Payment page - reservationDetails:', reservationDetails);
    
    if (!reservationDetails) {
      console.log('No reservation details available');
      return {
        tablePrice: 0,
        bottlesCost: 0,
        mixersCost: 0,
        gratAmount: 0,
        salesTax: 0,
        stripeFee: 0,
        subtotal: 0,
        total: 0
      };
    }

    const tablePrice = Number(reservationDetails.tablePrice) || 0;
    const bottles = reservationDetails.bottles || [];
    const mixers = reservationDetails.mixers || [];
    
    console.log('Cost calculation inputs:', {
      tablePrice,
      bottlesCount: bottles.length,
      mixersCount: mixers.length,
      bottles: bottles.map(b => ({ name: b.name, price: b.price })),
      mixers: mixers.map(m => ({ name: m.name, price: m.price }))
    });
    
    // Calculate costs
    const bottlesCost = bottles.reduce((total, bottle) => total + (Number(bottle.price) || 0), 0);
    const mixersCost = mixers.reduce((total, mixer) => total + (Number(mixer.price) || 0), 0);
    
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

    console.log('Payment page - cost breakdown:', {
      tablePrice,
      bottlesCost,
      mixersCost,
      salesTax,
      gratAmount,
      stripeFee,
      subtotal,
      total
    });

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
        {/* Back button */}
        <button
          onClick={handleGoBack}
          className="mb-6 flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <FiArrowLeft className="mr-2" size={20} />
          Back to Contact Info
        </button>

        {/* Payment Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Payment
          </h1>
          <p className="text-zinc-400">
            Table {reservationDetails.tableNumber} • {reservationDetails.guestCount} {reservationDetails.guestCount === 1 ? 'person' : 'people'}
          </p>
        </div>

        {/* Order Summary */}
        <div className="mb-8 p-6 bg-zinc-800 rounded-lg">
          <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between text-zinc-300">
              <span>Table Reservation</span>
              <span>{formatCurrency(reservationDetails.tablePrice || 0)}</span>
            </div>
            
            {reservationDetails.bottles && reservationDetails.bottles.length > 0 && (
              <>
                <div className="border-t border-zinc-700 pt-4">
                  <h3 className="text-white font-medium mb-2">Bottles</h3>
                  {reservationDetails.bottles.map((bottle, index) => (
                    <div key={index} className="flex justify-between text-zinc-300">
                      <span>{bottle.name}</span>
                      <span>{formatCurrency(bottle.price || 0)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            <div className="border-t border-zinc-700 pt-4 flex justify-between text-white font-bold">
              <span>Total</span>
              <span>{formatCurrency(costBreakdown.total || 0)}</span>
            </div>
          </div>
        </div>

        {/* Payment Actions */}
        <div className="mt-8 flex flex-col gap-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="p-4 bg-yellow-900/20 border border-yellow-900/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400">Test Mode</h3>
                  <p className="text-sm text-yellow-300/70">Skip payment for testing purposes</p>
                </div>
                <button
                  onClick={handleTestModePayment}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Test Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Regular payment button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full py-4 bg-cyan-600 text-white font-bold rounded-md hover:bg-cyan-700 transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : `Pay ${formatCurrency(costBreakdown.total || 0)}`}
          </button>

          {/* Payment Form */}
          {clientSecret && (
            <div className="mt-8">
              <PaymentForm
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                user={user}
                reservationDetails={reservationDetails}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 