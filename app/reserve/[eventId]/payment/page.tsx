"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useReservation } from '@/components/providers/ReservationProvider';
import { formatCostBreakdown } from '@/lib/services/payment';
import { useStripePayment } from '@/lib/hooks/useStripePayment';
import { toast } from 'react-hot-toast';
import { FiCreditCard, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createReservation } from '@/lib/services/reservations';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { reservationDetails } = useReservation();
  const { handlePaymentFlow } = useStripePayment();
  
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'error'>('pending');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  
  const eventId = params.eventId as string;
  
  useEffect(() => {
    if (!reservationDetails || !user) {
      router.push(`/reserve/${eventId}`);
    }
  }, [eventId, reservationDetails, router, user]);

  useEffect(() => {
    if (!paymentId) return;

    const paymentRef = doc(db, 'payments', paymentId);

    const unsubscribe = onSnapshot(paymentRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const paymentData = docSnapshot.data();

        if (paymentData.status === 'succeeded') {
          const reservationPayload = {
            paymentId,
            reservationDetails: {
              eventId: reservationDetails?.eventId ?? '',
              eventName: reservationDetails?.eventName ?? '',
              tableId: reservationDetails?.tableId ?? '',
              tableNumber: reservationDetails?.tableNumber ?? 0,
              tablePrice: reservationDetails?.tablePrice ?? 0,
              capacity: reservationDetails?.capacity ?? 1,
              guestCount: reservationDetails?.guestCount ?? 1,
              bottles: reservationDetails?.bottles ?? [],
              mixers: reservationDetails?.mixers ?? [],
              eventDate: reservationDetails?.eventDate ?? '',
              userName: user?.displayName ?? 'Guest',
              userEmail: user?.email ?? '',
              userId: user?.uid ?? '',
            },
          };

          createReservation(reservationPayload)
            .then(() => {
              setPaymentStatus('success');
              toast.success('Payment successful!');
              setTimeout(() => {
                router.push(`/reserve/${eventId}/confirmation`);
              }, 2000);
            })
            .catch((error) => {
              console.error('Error creating reservation:', error);
              setPaymentStatus('error');
              setPaymentError('Failed to create reservation. Please try again.');
              toast.error('Failed to create reservation');
            });

          unsubscribe();
        }
      }
    });

    return () => unsubscribe();
  }, [paymentId, eventId, reservationDetails, user, router]);
  
  const handleInitiatePayment = async () => {
    if (!reservationDetails || !user) {
      toast.error('Missing reservation details');
      return;
    }
    
    try {
      setLoading(true);
      setPaymentStatus('processing');
      
      // Get total amount in cents
      const totalAmount = Math.round(calculateTotal() * 100);
      
      const paymentId = await handlePaymentFlow({
        totalAmount,
        reservationDetails,
        userData: {
          userId: user.uid,
          name: user.displayName || 'Guest',
          email: user.email || '',
        },
        onSuccess: () => {
          console.log('Payment initiated successfully');
        },
      });

      setPaymentId(paymentId);
    } catch (err: any) {
      console.error('Error initiating payment:', err);
      setPaymentStatus('error');
      setPaymentError(err.message || 'Failed to initiate payment');
      setLoading(false);
      toast.error('An error occurred while initiating payment');
    }
  };

  const calculateTotal = () => {
    if (!reservationDetails) return 0;
    const { total } = formatCostBreakdown(reservationDetails);
    return total;
  };
  
  if (!reservationDetails) {
    return (
      <div className="min-h-screen pt-28 pb-12 flex flex-col items-center">
        <div className="w-full max-w-2xl mx-auto px-4">
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-500 mb-4">Reservation not found</p>
              <button
                onClick={() => router.push('/events')}
                className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
              >
                Back to Events
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const costBreakdown = formatCostBreakdown(reservationDetails);
  
  return (
    <div className="min-h-screen pt-28 pb-12 flex flex-col">
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Reservation Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Complete Your Reservation
          </h1>
          <p className="text-cyan-400">
            {reservationDetails.eventName} - {reservationDetails.eventDate}
          </p>
        </div>
        
        {/* Main Content */}
        <div className="bg-zinc-900 rounded-lg border border-cyan-900/30 overflow-hidden">
          {/* Reservation Summary */}
          <div className="p-6 border-b border-cyan-900/30">
            <h2 className="text-xl font-bold text-white mb-4">Reservation Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-400">Event:</span>
                <span className="text-white">{reservationDetails.eventName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Date:</span>
                <span className="text-white">
                  {new Date(reservationDetails.eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Table:</span>
                <span className="text-white">#{reservationDetails.tableNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Guests:</span>
                <span className="text-white">{reservationDetails.guestCount}</span>
              </div>
            </div>
          </div>
          
          {/* Cost Breakdown */}
          <div className="p-6 border-b border-cyan-900/30">
            <h2 className="text-xl font-bold text-white mb-4">Cost Breakdown</h2>
            <div className="space-y-4">
              {/* Table Price */}
              <div className="flex justify-between">
                <span className="text-zinc-400">Table Price:</span>
                <span className="text-white">${costBreakdown.tablePrice.toFixed(2)}</span>
              </div>

              {/* Bottles Breakdown */}
              {reservationDetails.bottles && reservationDetails.bottles.length > 0 && (
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-zinc-400">Bottles:</span>
                    <span className="text-white">${costBreakdown.bottlesCost.toFixed(2)}</span>
                  </div>
                  <div className="ml-4 space-y-1">
                    {reservationDetails.bottles.map((bottle) => (
                      <div key={bottle.id} className="flex justify-between text-sm">
                        <span className="text-zinc-500">{bottle.name}</span>
                        <span className="text-zinc-400">${bottle.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mixers */}
              <div className="flex justify-between">
                <span className="text-zinc-400">Mixers:</span>
                <span className="text-white">${costBreakdown.mixersCost.toFixed(2)}</span>
              </div>

              {/* Service Fee */}
              <div className="flex justify-between">
                <span className="text-zinc-400">Service Fee:</span>
                <span className="text-white">${costBreakdown.serviceFee.toFixed(2)}</span>
              </div>

              {/* Total */}
              <div className="border-t border-zinc-700 pt-2 mt-2 flex justify-between font-bold">
                <span className="text-white">Total:</span>
                <span className="text-cyan-400">${costBreakdown.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          {/* Payment Status */}
          <div className="p-6 border-b border-cyan-900/30">
            <h2 className="text-xl font-bold text-white mb-4">Payment Status</h2>
            <div className="flex flex-col items-center justify-center py-6">
              {paymentStatus === 'pending' && (
                <>
                  <FiCreditCard size={48} className="text-cyan-400 mb-4" />
                  <p className="text-white text-center">
                    Ready to complete your reservation!
                  </p>
                </>
              )}
              
              {paymentStatus === 'processing' && (
                <>
                  <div className="w-12 h-12 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-white text-center">
                    Processing your payment...
                  </p>
                </>
              )}
              
              {paymentStatus === 'success' && (
                <>
                  <FiCheckCircle size={48} className="text-green-500 mb-4" />
                  <p className="text-white text-center">
                    Payment successful! Redirecting to confirmation page...
                  </p>
                </>
              )}
              
              {paymentStatus === 'error' && (
                <>
                  <FiAlertCircle size={48} className="text-red-500 mb-4" />
                  <p className="text-white text-center">
                    An error occurred: {paymentError}
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-6">
            {paymentStatus === 'pending' && (
              <button
                onClick={handleInitiatePayment}
                disabled={loading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded transition-colors disabled:bg-cyan-900 disabled:cursor-not-allowed"
              >
                Complete Payment
              </button>
            )}
            
            {paymentStatus === 'error' && (
              <button
                onClick={handleInitiatePayment}
                disabled={loading}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded transition-colors disabled:bg-cyan-900 disabled:cursor-not-allowed"
              >
                Try Again
              </button>
            )}
            
            {(paymentStatus === 'processing' || paymentStatus === 'success') && (
              <button
                disabled
                className="w-full py-3 bg-cyan-900 text-white font-bold rounded cursor-not-allowed"
              >
                {paymentStatus === 'processing' ? 'Processing...' : 'Payment Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 