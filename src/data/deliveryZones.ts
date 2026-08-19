// Centralized delivery zone configuration
// Pincode → Delivery charge in ₹

export const DELIVERY_ZONES: Record<string, number> = {
  // Zone A — ₹30
  "641014": 30,
  "641048": 30,
  "641051": 30,

  // Zone B — ₹50
  "641004": 50,
  "641035": 50,
  "641062": 50,
  "641028": 50,
  "641107": 50,

  // Zone C — ₹80
  "641005": 80,
  "641018": 80,
  "641006": 80,
  "641037": 80,
  "641045": 80,
  "641012": 80,
};

export const MINIMUM_ORDER_VALUE = 80;

export const BUSINESS_PHONE = "9790209685";

export const DELIVERY_CUTOFF_TIME = "11:00 AM";
export const DELIVERY_TIME = "Evening";

export function getDeliveryCharge(pincode: string): number | null {
  return DELIVERY_ZONES[pincode] ?? null;
}

export function isValidPincode(pincode: string): boolean {
  return pincode in DELIVERY_ZONES;
}
