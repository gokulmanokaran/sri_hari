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

export function calculateTotal(subtotal: number, deliveryCharge: number): number {
  return subtotal + deliveryCharge;
}

export function getMinimumOrderShortfall(subtotal: number, minimum: number): number {
  return Math.max(0, minimum - subtotal);
}
