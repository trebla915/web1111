"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useReservation } from '@/components/providers/ReservationProvider';
import { PaymentService } from '@/lib/services/payment';
import { toast } from 'react-hot-toast';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import StripeProvider from '@/components/providers/StripeProvider';
import { FiCreditCard, FiCheckCircle, FiAlertCircle, FiArrowLeft, FiLock, FiAlertTriangle } from 'react-icons/fi';
import { AuthUser } from '@/types/user';
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { RouteLoading } from "@/components/ui/page-state";
import { ReservationStepHeader } from "@/components/reservation/ReservationSteps";

function PaymentForm({ clientSecret, onSuccess, user, reservationDetails }: { 
  clientSecret: string; 
  onSuccess: () => void;
  user: AuthUser | null;
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
          return_url: `${window.location.origin}/reserve/${window.location.pathname.split('/')[2]}/confirmation`,
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
      <div className="p-3 sm:p-6 border border-line rounded-lg bg-surface/50">
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
            },
          }}
        />
      </div>
      {/* A ⚠️ emoji was standing in for an icon in a file that imports an icon
          set, and the submit button re-declared its own disabled colours. */}
      {!bottleRequirement.met && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-warning-line/40 bg-warning-950/40 p-3 text-sm text-warning-200">
          <FiAlertTriangle aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
          <span>
            Table {reservationDetails?.tableNumber} needs at least {bottleRequirement.required} bottle
            {bottleRequirement.required > 1 ? 's' : ''}; you have {bottleRequirement.current}. Go back
            and add more to continue.
          </span>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger-bright">{error}</p>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        full
        loading={isProcessing}
        disabled={!stripe || isProcessing || !bottleRequirement.met}
      >
        {isProcessing
          ? 'Processing'
          : bottleRequirement.met
            ? 'Pay now'
            : `Add ${bottleRequirement.required - bottleRequirement.current} more bottle${
                bottleRequirement.required - bottleRequirement.current > 1 ? 's' : ''
              }`}
      </Button>
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
          userId: user?.uid || '',
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
      const token = await user?.getIdToken();
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
    return <RouteLoading message="Loading your reservation…" />;
  }

  const costBreakdown = (() => {
    if (!reservationDetails) {
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
    <div className="flex min-h-dvh flex-col pt-24 pb-16 sm:pt-28">
      <div className="mx-auto w-full max-w-2xl px-4">
        <Button onClick={handleGoBack} variant="ghost" size="md" className="mb-4 -ml-4">
          <FiArrowLeft aria-hidden="true" size={18} />
          Back to contact info
        </Button>

        <ReservationStepHeader
          step="payment"
          eventName={reservationDetails.eventName}
          title="Review and pay"
          description={`Table ${reservationDetails.tableNumber} for ${reservationDetails.guestCount} ${
            reservationDetails.guestCount === 1 ? 'guest' : 'guests'
          }.`}
        />

        {/* Order summary.
            This listed the table, the bottles and then the total — leaving the
            tax, the 18% gratuity and the card fee out entirely. On a $1,150
            order that is a $562 gap between the figures shown and the figure
            charged, on the screen where the guest hands over a card. The same
            breakdown the details step showed is repeated here. */}
        <div className="mb-6 rounded-lg border border-line-accent/30 bg-surface p-4 sm:p-6">
          <h2 className="mb-4 font-heading text-lg tracking-wide text-fg">Order summary</h2>

          <dl className="text-sm">
            <div className="space-y-2">
              <div className="flex justify-between gap-3">
                <dt className="text-fg-dim">Table {reservationDetails.tableNumber}</dt>
                <dd className="tabular text-fg">{formatCurrency(costBreakdown.tablePrice)}</dd>
              </div>

              {reservationDetails.bottles?.map((bottle, index) => (
                <div key={index} className="flex justify-between gap-3">
                  <dt className="min-w-0 truncate text-fg-dim">{bottle.name}</dt>
                  <dd className="tabular shrink-0 text-fg">{formatCurrency(bottle.price || 0)}</dd>
                </div>
              ))}

              {costBreakdown.mixersCost > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-fg-dim">Mixers</dt>
                  <dd className="tabular text-fg">{formatCurrency(costBreakdown.mixersCost)}</dd>
                </div>
              )}
            </div>

            <div className="mt-3 flex justify-between gap-3 border-t border-line-subtle pt-3">
              <dt className="text-fg-dim">Subtotal</dt>
              <dd className="tabular text-fg">
                {formatCurrency(costBreakdown.tablePrice + costBreakdown.bottlesCost + costBreakdown.mixersCost)}
              </dd>
            </div>

            <div className="mt-3 space-y-2 border-t border-line-subtle pt-3">
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">
                  Sales tax <span className="tabular text-fg-subtle">8.25%</span>
                </dt>
                <dd className="tabular text-fg-dim">{formatCurrency(costBreakdown.salesTax)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">
                  Gratuity <span className="tabular text-fg-subtle">18% on bottles</span>
                </dt>
                <dd className="tabular text-fg-dim">{formatCurrency(costBreakdown.gratAmount)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-fg-muted">
                  Card processing <span className="tabular text-fg-subtle">2.9% + $0.30</span>
                </dt>
                <dd className="tabular text-fg-dim">{formatCurrency(costBreakdown.stripeFee)}</dd>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t-2 border-line-strong pt-4">
              <dt className="font-heading text-lg tracking-wide text-fg">Total due</dt>
              <dd className="tabular font-heading text-2xl tracking-wide text-fg sm:text-3xl">
                {formatCurrency(costBreakdown.total || 0)}
              </dd>
            </div>
          </dl>

          {/* Each line is rounded to the cent independently, so the column can
              read a penny either side of the total. "Total due" is the figure
              submitted to Stripe. */}
          <p className="mt-3 text-xs text-fg-subtle">
            Each line is rounded to the nearest cent, so the figures above can differ from the
            total by a penny. Total due is the amount charged.
          </p>
        </div>

        {/* Payment Actions */}
        <div className="flex flex-col gap-6">
          {process.env.NODE_ENV === 'development' && (
            <div className="flex flex-col gap-4 rounded-lg border border-attention-700/50 bg-attention-900/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h3 className="font-heading text-base tracking-wide text-attention-300">Test mode</h3>
                <p className="mt-0.5 text-sm text-attention-200/80">
                  Development only — completes the booking without a charge.
                </p>
              </div>
              <Button
                onClick={handleTestModePayment}
                disabled={isProcessing}
                loading={isProcessing}
                variant="outline"
                size="md"
                className="shrink-0 border-attention-600 text-attention-200 hover:bg-attention-900/40"
              >
                {isProcessing ? 'Processing' : 'Test payment'}
              </Button>
            </div>
          )}

          {/* Regular payment button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            loading={isProcessing}
            variant="primary"
            size="lg"
            full
          >
            {isProcessing ? 'Processing' : `Pay ${formatCurrency(costBreakdown.total || 0)}`}
          </Button>

          <p className="flex items-center justify-center gap-2 text-xs text-fg-subtle">
            <FiLock aria-hidden="true" size={12} />
            Card details are handled by Stripe. We never see or store them.
          </p>

          {/* Payment Form */}
          {clientSecret && (
            <div>
              <StripeProvider clientSecret={clientSecret}>
                <PaymentForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  user={user}
                  reservationDetails={reservationDetails}
                />
              </StripeProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 