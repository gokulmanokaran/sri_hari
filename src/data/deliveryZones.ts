// Centralized delivery zone configuration
// Each zone maps pincodes → { charge, minimumOrder }

export interface DeliveryZone {
  charge: number;       // Delivery charge in ₹
  minimumOrder: number; // Minimum order value in ₹
}

// Zone A — ₹30 delivery, ₹199 minimum order
const ZONE_A: DeliveryZone = { charge: 30, minimumOrder: 199 };

// Zone B — ₹50 delivery, ₹249 minimum order
const ZONE_B: DeliveryZone = { charge: 50, minimumOrder: 249 };

// Zone C — ₹80 delivery, ₹299 minimum order
const ZONE_C: DeliveryZone = { charge: 80, minimumOrder: 299 };

export const DELIVERY_ZONES: Record<string, DeliveryZone> = {
  // Zone A — ₹30 charge, min ₹199
  "641014": ZONE_A,
  "641048": ZONE_A,
  "641051": ZONE_A,

  // Zone B — ₹50 charge, min ₹249
  "641004": ZONE_B,
  "641035": ZONE_B,
  "641062": ZONE_B,
  "641028": ZONE_B,
  "641107": ZONE_B,

  // Zone C — ₹80 charge, min ₹299
  "641005": ZONE_C,
  "641018": ZONE_C,
  "641006": ZONE_C,
  "641037": ZONE_C,
  "641045": ZONE_C,
  "641012": ZONE_C,
};

/** Fallback global minimum (used before a pincode is selected) */
export const DEFAULT_MINIMUM_ORDER = 199;

export const BUSINESS_PHONE = "8438758801";

export function getDeliveryZone(pincode: string): DeliveryZone | null {
  return DELIVERY_ZONES[pincode] ?? null;
}

export function getDeliveryCharge(pincode: string): number | null {
  return DELIVERY_ZONES[pincode]?.charge ?? null;
}

export function getMinimumOrder(pincode: string): number {
  return DELIVERY_ZONES[pincode]?.minimumOrder ?? DEFAULT_MINIMUM_ORDER;
}

export function isValidPincode(pincode: string): boolean {
  return pincode in DELIVERY_ZONES;
}
