"use strict";
/**
 * Payment calculation utilities
 * Single source of truth for all payment-related calculations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateStripeFee = calculateStripeFee;
exports.calculateBottlesCost = calculateBottlesCost;
exports.calculateBottleGratuity = calculateBottleGratuity;
exports.calculateMixersCost = calculateMixersCost;
exports.calculateCostBreakdown = calculateCostBreakdown;
exports.calculateTotalCharge = calculateTotalCharge;
const STRIPE_PERCENTAGE = 0.029; // 2.9%
const STRIPE_FIXED_FEE = 0.30; // $0.30
const BOTTLE_GRATUITY_PERCENTAGE = 0.18; // 18%
/**
 * Calculates Stripe's processing fee (2.9% + $0.30)
 */
function calculateStripeFee(amount) {
    return (amount * STRIPE_PERCENTAGE) + STRIPE_FIXED_FEE;
}
/**
 * Calculates the total cost of bottles
 */
function calculateBottlesCost(bottles = []) {
    return bottles.reduce((total, bottle) => total + (bottle.price || 0), 0);
}
/**
 * Calculates gratuity on bottles (18%)
 */
function calculateBottleGratuity(bottlesCost) {
    return bottlesCost * BOTTLE_GRATUITY_PERCENTAGE;
}
/**
 * Calculates the total cost of mixers
 */
function calculateMixersCost(mixers = []) {
    return mixers.reduce((total, mixer) => total + (mixer.price || 0), 0);
}
/**
 * Calculates the complete cost breakdown including bottle gratuity and Stripe processing fee
 */
function calculateCostBreakdown(tablePrice = 0, bottles = [], mixers = []) {
    const bottlesCost = calculateBottlesCost(bottles);
    const mixersCost = calculateMixersCost(mixers);
    const subtotal = tablePrice + bottlesCost + mixersCost;
    const bottleGratuity = calculateBottleGratuity(bottlesCost);
    const subtotalWithGratuity = subtotal + bottleGratuity;
    const stripeFee = calculateStripeFee(subtotalWithGratuity);
    const total = subtotalWithGratuity + stripeFee;
    return {
        tablePrice,
        bottlesCost,
        mixersCost,
        subtotal,
        bottleGratuity,
        stripeFee,
        total
    };
}
/**
 * Calculates the final amount to charge including bottle gratuity and Stripe fee
 */
function calculateTotalCharge(tablePrice = 0, bottles = [], mixers = []) {
    const { total } = calculateCostBreakdown(tablePrice, bottles, mixers);
    return Math.round(total * 100) / 100; // Round to 2 decimal places
}
