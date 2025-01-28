import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { apiClient } from '../../../utils/apiClient'; // Import the apiClient
import Header from '../../../components/Header'; // Import Header
import Footer from '../../../components/Footer'; // Import Footer

const Step3 = () => {
  const router = useRouter();
  const { id, tableId, tablePrice, bottles } = router.query; // Get eventId, tableId, tablePrice, and bottles from URL query

  const [total, setTotal] = useState<number>(0);
  const [stripeFee, setStripeFee] = useState<number>(0);
  const [paymentIntent, setPaymentIntent] = useState<any>(null); // Store the payment intent response
  const [error, setError] = useState<string | null>(null);

  const stripe = useStripe();
  const elements = useElements();

  // Fetch the cost breakdown and create a payment intent on the backend
  useEffect(() => {
    if (tableId && bottles) {
      const bottleTotal = Array.isArray(bottles)
        ? bottles.reduce((acc: number, bottle: any) => acc + bottle.price, 0)
        : 0;
      const calculatedStripeFee = (bottleTotal + Number(tablePrice)) * 0.029 + 0.3; // Stripe fee (2.9% + $0.30 fixed fee)
      const totalAmount = bottleTotal + Number(tablePrice) + calculatedStripeFee;

      setTotal(totalAmount);
      setStripeFee(calculatedStripeFee);

      // Call backend API to create payment intent
      createPaymentIntent(totalAmount);
    }
  }, [tableId, bottles, tablePrice]);

  const createPaymentIntent = async (totalAmount: number) => {
    try {
      const metadata = {
        name: 'Guest Name', // Replace with dynamic name
        email: 'guest@email.com', // Replace with dynamic email
        eventName: 'Event Name', // Replace with dynamic event name
        tableNumber: tableId,
      };

      const reservationDetails = {
        userId: 'user-id', // Replace with dynamic user ID
        eventId: id as string,
        tableId: tableId as string,
      };

      // Request backend to create the PaymentIntent
      const response = await apiClient.post('/api/payments/create-payment-intent', {
        totalAmount,
        metadata,
        reservationDetails,
      });

      setPaymentIntent(response.data); // Store the paymentIntent
    } catch (error) {
      setError('Error creating payment intent.');
      console.error(error);
    }
  };

  const handlePayment = async () => {
    if (!paymentIntent) {
      setError('Payment intent not created.');
      return;
    }

    try {
      const { clientSecret } = paymentIntent;
      const cardElement = elements?.getElement(CardElement);

      if (!cardElement) {
        setError('Card element not found');
        return;
      }

      // Stripe payment confirmation with type guards to ensure valid types
      const { error: stripeError, paymentIntent: confirmedPaymentIntent } = await stripe?.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'Guest Name', // Modify as needed
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
      } else {
        // Handle successful payment
        if (confirmedPaymentIntent?.status === 'succeeded') {
          router.push('/reserve/confirmation');
        } else {
          setError('Payment failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Error processing payment.');
      console.error(err);
    }
  };

  return (
    <>
      <Header />
      <div className="flex flex-col justify-center items-center min-h-screen py-8 bg-gradient-to-b from-gray-900 via-gray-800 to-black">
        <h1 className="text-4xl font-bold text-center mb-8 text-white">Payment and Cost Breakdown</h1>

        {/* Display the breakdown */}
        <div className="w-full max-w-4xl mx-auto p-4 bg-white bg-opacity-40 rounded-lg shadow-lg backdrop-blur-md">
          <h3 className="text-xl font-bold">Cost Breakdown</h3>
          <div className="mt-4">
            <div className="flex justify-between">
              <span>Table Price:</span>
              <span>${tablePrice}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Bottles Price:</span>
              <span>${Array.isArray(bottles) ? bottles.reduce((acc: number, bottle: any) => acc + bottle.price, 0) : 0}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span>Stripe Fee:</span>
              <span>${stripeFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mt-4">
              <span className="font-bold">Total:</span>
              <span className="font-bold">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Stripe Payment Form */}
          <div className="mt-4">
            <CardElement />
            <button
              onClick={handlePayment}
              className="mt-4 bg-blue-600 text-white py-2 px-6 rounded-md w-full max-w-xs"
            >
              Proceed to Payment
            </button>
          </div>

          {/* Error handling */}
          {error && <div className="text-red-500 mt-2">{error}</div>}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Step3;