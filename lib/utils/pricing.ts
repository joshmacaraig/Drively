import { CarPricingRule } from '@/lib/types/database';

export interface PriceCalculation {
  basePrice: number;
  discount: number;
  discountPercentage: number;
  finalPrice: number;
  appliedRule?: CarPricingRule;
}

/**
 * Calculate rental price with discounts applied
 * @param dailyRate - The daily rate of the car
 * @param rentalDays - Number of days for the rental
 * @param pricingRules - Array of pricing rules for the car
 * @returns PriceCalculation object with detailed breakdown
 */
export function calculateRentalPrice(
  dailyRate: number,
  rentalDays: number,
  pricingRules?: CarPricingRule[]
): PriceCalculation {
  const basePrice = dailyRate * rentalDays;

  // If no pricing rules or empty array, return base price
  if (!pricingRules || pricingRules.length === 0) {
    return {
      basePrice,
      discount: 0,
      discountPercentage: 0,
      finalPrice: basePrice,
    };
  }

  // Find applicable rules (where min_days <= rentalDays)
  const applicableRules = pricingRules.filter(
    (rule) => rule.is_active && rule.min_days <= rentalDays
  );

  // If no applicable rules, return base price
  if (applicableRules.length === 0) {
    return {
      basePrice,
      discount: 0,
      discountPercentage: 0,
      finalPrice: basePrice,
    };
  }

  // Find the best discount (highest min_days that qualifies)
  const bestRule = applicableRules.reduce((best, current) =>
    current.min_days > best.min_days ? current : best
  );

  // Calculate discount based on type
  let discount = 0;
  if (bestRule.discount_type === 'percentage') {
    discount = basePrice * (bestRule.discount_value / 100);
  } else if (bestRule.discount_type === 'fixed') {
    discount = bestRule.discount_value;
  }

  // Ensure final price doesn't go below 0
  const finalPrice = Math.max(0, basePrice - discount);
  const discountPercentage = basePrice > 0 ? (discount / basePrice) * 100 : 0;

  return {
    basePrice,
    discount,
    discountPercentage,
    finalPrice,
    appliedRule: bestRule,
  };
}

/**
 * Format currency for display (Philippine Peso)
 */
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format discount description for display
 */
export function formatDiscountDescription(rule: CarPricingRule): string {
  const discountText =
    rule.discount_type === 'percentage'
      ? `${rule.discount_value}% off`
      : `₱${rule.discount_value.toLocaleString()} off`;

  return `${rule.min_days}+ days: ${discountText}`;
}
