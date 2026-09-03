export function formatPrice(amount: number): string {
  return `₹${amount}`;
}

export function formatPriceWithUnit(price: number, unit: string): string {
  return `₹${price} / ${unit}`;
}

export function calculateSubtotal(
  items: Array<{ price: number; quantity: number }>
): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ── Delivery Charge Rules based on Order Value ───────────────────────────────
//  Below ₹199  → Order not allowed (minimum order is ₹199)
//  ₹199 – ₹299 → ₹30 delivery charge
//  Above ₹299  → FREE Delivery

export const MINIMUM_ORDER_VALUE = 199;
export const FREE_DELIVERY_THRESHOLD = 299; // Above ₹299 is FREE delivery
export const STANDARD_DELIVERY_CHARGE = 30; // ₹199 to ₹299 is ₹30 delivery charge

export function calculateDeliveryCharge(subtotal: number): number {
  if (subtotal > FREE_DELIVERY_THRESHOLD) {
    return 0; // FREE Delivery
  }
  return STANDARD_DELIVERY_CHARGE; // ₹30 delivery charge
}

// ── Discount Rules (Removed completely) ──────────────────────────────────────
// Returns 0 discount for compatibility
export interface DiscountResult {
  rate: number;
  percentage: number;
  amount: number;
}

export function calculateDiscount(_subtotal: number): DiscountResult {
  return { rate: 0, percentage: 0, amount: 0 };
}

/**
 * Final payable amount:
 * Product Subtotal + Applicable Delivery Charge = Final Payable Amount
 */
export function calculateTotal(subtotal: number, deliveryCharge: number): number {
  return subtotal + deliveryCharge;
}

export function getMinimumOrderShortfall(subtotal: number, minimum: number = MINIMUM_ORDER_VALUE): number {
  return Math.max(0, minimum - subtotal);
}

