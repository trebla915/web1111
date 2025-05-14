/**
 * Payment calculation utilities
 * Single source of truth for all payment-related calculations
 */

export interface CostBreakdown {
  tablePrice: number;
  bottlesCost: number;
  mixersCost: number;
  subtotal: number;
  bottleGratuity: number;  // 18% gratuity on bottles only
  stripeFee: number;
  total: number;
}

export interface PriceItem {
  price: number;
}

const STRIPE_PERCENTAGE = 0.029; // 2.9%
const STRIPE_FIXED_FEE = 0.30; // $0.30
const BOTTLE_GRATUITY_PERCENTAGE = 0.18; // 18%

/**
 * Calculates Stripe's processing fee (2.9% + $0.30)
 */
export function calculateStripeFee(amount: number): number {
  return (amount * STRIPE_PERCENTAGE) + STRIPE_FIXED_FEE;
}

/**
 * Calculates the total cost of bottles
 */
export function calculateBottlesCost(bottles: PriceItem[] = []): number {
  return bottles.reduce((total, bottle) => total + (bottle.price || 0), 0);
}

/**
 * Calculates gratuity on bottles (18%)
 */
export function calculateBottleGratuity(bottlesCost: number): number {
  return bottlesCost * BOTTLE_GRATUITY_PERCENTAGE;
}

/**
 * Calculates the total cost of mixers
 */
export function calculateMixersCost(mixers: PriceItem[] = []): number {
  return mixers.reduce((total, mixer) => total + (mixer.price || 0), 0);
}

/**
 * Calculates the complete cost breakdown including bottle gratuity and Stripe processing fee
 */
export function calculateCostBreakdown(
  tablePrice: number = 0,
  bottles: PriceItem[] = [],
  mixers: PriceItem[] = []
): CostBreakdown {
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
export function calculateTotalCharge(
  tablePrice: number = 0,
  bottles: PriceItem[] = [],
  mixers: PriceItem[] = []
): number {
  const { total } = calculateCostBreakdown(tablePrice, bottles, mixers);
  return Math.round(total * 100) / 100; // Round to 2 decimal places
}
