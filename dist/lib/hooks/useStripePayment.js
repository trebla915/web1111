"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStripePayment = void 0;
const stripe_js_1 = require("@stripe/stripe-js");
const payment_1 = require("@/lib/services/payment");
// Initialize Stripe
const stripePromise = (0, stripe_js_1.loadStripe)(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
const useStripePayment = () => {
    const handlePaymentFlow = async ({ totalAmount, reservationDetails, userData, onSuccess, }) => {
        try {
            // Create payment intent
            const { clientSecret, paymentId } = await (0, payment_1.createPaymentIntent)({
                amount: totalAmount,
                reservationDetails,
                userId: userData.userId,
                userEmail: userData.email,
                userName: userData.name,
            });
            // Load Stripe
            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error('Failed to load Stripe');
            }
            // Create payment element
            const { error: paymentError } = await stripe.confirmPayment({
                elements: {
                    clientSecret,
                },
                confirmParams: {
                    return_url: `${window.location.origin}/reserve/${reservationDetails.eventId}/confirmation`,
                },
            });
            if (paymentError) {
                throw new Error(paymentError.message);
            }
            onSuccess();
            return paymentId;
        }
        catch (error) {
            console.error('[handlePaymentFlow] Error:', error);
            throw error;
        }
    };
    return { handlePaymentFlow };
};
exports.useStripePayment = useStripePayment;
