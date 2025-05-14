"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCostBreakdown = exports.PaymentService = void 0;
const client_1 = require("@/lib/api/client");
const endpoints_1 = require("@/lib/api/endpoints");
exports.PaymentService = {
    /**
     * Create a payment intent with Stripe
     */
    createPaymentIntent: async (amount, metadata, reservationDetails) => {
        try {
            // Convert amount to cents (smallest currency unit)
            const amountInCents = Math.round(amount * 100);
            const response = await client_1.apiClient.post(endpoints_1.API_ENDPOINTS.payments.createIntent, {
                amount: amount,
                reservationId: reservationDetails.reservationId,
                eventId: reservationDetails.eventId,
                userId: reservationDetails.userId,
                metadata
            });
            return response.data;
        }
        catch (error) {
            console.error('Error creating payment intent:', error);
            throw error;
        }
    },
    /**
     * Confirm a payment
     */
    confirmPayment: async (paymentId) => {
        try {
            await client_1.apiClient.post(endpoints_1.API_ENDPOINTS.payments.confirm(paymentId));
        }
        catch (error) {
            console.error('Error confirming payment:', error);
            throw error;
        }
    },
    /**
     * Format the cost breakdown for display
     */
    formatCostBreakdown: (tablePrice, bottles = [], mixers = []) => {
        const bottlesCost = bottles.reduce((total, bottle) => total + (bottle.price || 0), 0);
        const mixersCost = mixers.reduce((total, mixer) => total + (mixer.price || 0), 0);
        const subtotal = tablePrice + bottlesCost + mixersCost;
        const serviceFee = subtotal * 0.1; // 10% service fee
        const total = subtotal + serviceFee;
        return {
            tablePrice,
            bottlesCost,
            mixersCost,
            serviceFee,
            total
        };
    }
};
// Direct export of formatCostBreakdown function
const formatCostBreakdown = (reservationDetails) => {
    const tablePrice = reservationDetails.tablePrice || 0;
    const bottles = reservationDetails.bottles || [];
    const mixers = reservationDetails.mixers || [];
    const bottlesCost = bottles.reduce((total, bottle) => total + (bottle.price || 0), 0);
    const mixersCost = mixers.reduce((total, mixer) => total + (mixer.price || 0), 0);
    const subtotal = tablePrice + bottlesCost + mixersCost;
    const serviceFee = subtotal * 0.1; // 10% service fee
    const total = subtotal + serviceFee;
    return {
        tablePrice,
        bottlesCost,
        mixersCost,
        serviceFee,
        total
    };
};
exports.formatCostBreakdown = formatCostBreakdown;
