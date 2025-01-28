"use client";

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useRouter } from "next/router";

// Load Stripe outside of a component to avoid re-initialization on each render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface ReservationDetails {
  table: string;
  guests: number;
  bottles: number;
  total: number;
}

const Checkout = () => {
  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState<string | null>(null);

  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (!id) return;

    // Fetch reservation data from your database (Firestore, etc.)
    const fetchReservationData = async () => {
      // Simulating fetching data
      setReservation({
        table: "Table A",
        guests: 2,
        bottles: 1,
        total: 100, // Example total
      });
    };

    fetchReservationData();
  }, [id]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !reservation) {
      setError("Payment method is not ready.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the backend to create a payment intent and get the client secret
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        body: JSON.stringify({ amount: reservation.total * 100 }), // amount in cents
      });
      const data = await res.json();
      setPaymentIntentClientSecret(data.clientSecret);

      // Confirm the payment
      const { error } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (error) {
        setError(error.message || "Payment failed");
      } else {
        alert("Payment successful!");
        router.push("/confirmation");
      }
    } catch (err) {
      setError("An error occurred during payment.");
    } finally {
      setLoading(false);
    }
  };

  if (!reservation) {
    return <div>Loading reservation details...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6 py-8">
      <div className="max-w-xl w-full bg-gray-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-8">Confirm Your Reservation</h2>
        {error && <div className="text-red-400 mb-4">{error}</div>}

        <div className="mb-6">
          <h3 className="text-2xl font-semibold">Reservation Details</h3>
          <p className="text-lg">Table: {reservation.table}</p>
          <p className="text-lg">Guests: {reservation.guests}</p>
          <p className="text-lg">Bottles: {reservation.bottles}</p>
          <p className="text-lg font-bold">Total: ${reservation.total}</p>
        </div>

        <form onSubmit={handlePayment} className="space-y-6">
          <div className="mb-4">
            <label htmlFor="card-element" className="block text-lg font-medium mb-2">
              Credit or Debit Card
            </label>
            <CardElement id="card-element" className="w-full p-4 rounded-lg bg-gray-700" />
          </div>

          <button
            type="submit"
            disabled={!stripe || loading}
            className={`w-full py-4 rounded-lg font-bold text-lg ${
              loading ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "Processing..." : "Pay ${reservation.total}"}
          </button>
        </form>
      </div>
    </div>
  );
};

const StripeWrapper = () => (
  <Elements stripe={stripePromise}>
    <Checkout />
  </Elements>
);

export default StripeWrapper;