"use client";

import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';
import type { StripeCardElementChangeEvent } from '@stripe/stripe-js';

export default function PaymentForm({
  clientSecret,
  amount,
  onSuccess
}: {
  clientSecret: string;
  amount: number; // ✅ Expect amount in cents
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    try {
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (stripeError) throw new Error(stripeError.message);
      onSuccess();
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-6 p-6 border border-white/20 backdrop-blur-lg rounded-xl bg-black/50"
    >
      {/* Title */}
      <h2 className="text-2xl font-bold text-white text-center">Enter Payment Details</h2>

      {/* Card Input */}
      <div className="p-4 border border-white/30 rounded-lg bg-transparent text-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '18px',
                color: '#FFFFFF', // 🔥 Ensures card number, expiry, CVC are white
                '::placeholder': {
                  color: '#AAAAAA' // Light gray for placeholder text
                },
              },
              invalid: {
                color: '#FF4D4D', // Red for invalid card input
              },
            }
          }}
          className="w-full p-2 bg-transparent"
          onChange={(e: StripeCardElementChangeEvent) => setCardComplete(e.complete)}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!cardComplete || processing}
        className="w-full py-4 border border-white text-white rounded-xl font-bold transition-all hover:bg-white hover:text-black disabled:opacity-50"
      >
        {processing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`} {/* ✅ Fix Here */}
      </button>
      
      {/* Error Message */}
      {error && (
        <div className="text-center py-3 px-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}
    </form>
  );
}