// Centralized delivery zone configuration
// Maps Coimbatore service pincodes → { charge, minimumOrder }

export interface DeliveryZone {
  charge: number;       // Base delivery charge in ₹ (fallback)
  minimumOrder: number; // Minimum order value in ₹ (199)
  zoneName?: string;
}

/** Specific PIN codes where delivery is explicitly NOT available */
export const NON_SERVICEABLE_PINCODES = [
  "641005",
  "641018",
  "641006",
  "641037",
  "641045",
  "641012",
] as const;

export const MINIMUM_ORDER_VALUE = 199;
export const FREE_DELIVERY_THRESHOLD = 299; // Above ₹299 is FREE delivery
export const STANDARD_DELIVERY_CHARGE = 30; // ₹199 to ₹299 is ₹30 delivery charge

/** Standard service zone configuration */
const STANDARD_ZONE: DeliveryZone = {
  charge: STANDARD_DELIVERY_CHARGE,
  minimumOrder: MINIMUM_ORDER_VALUE,
  zoneName: "Coimbatore Delivery Area",
};

export const DELIVERY_ZONES: Record<string, DeliveryZone> = {
  // Serviceable PIN codes in Coimbatore
  "641014": STANDARD_ZONE,
  "641048": STANDARD_ZONE,
  "641051": STANDARD_ZONE,
  "641004": STANDARD_ZONE,
  "641035": STANDARD_ZONE,
  "641062": STANDARD_ZONE,
  "641028": STANDARD_ZONE,
  "641107": STANDARD_ZONE,
};

/** Global minimum order value */
export const DEFAULT_MINIMUM_ORDER = MINIMUM_ORDER_VALUE;

export const BUSINESS_PHONE = "9790209685";

/** Check if a pincode is explicitly in the non-serviceable list */
export function isNonServiceablePincode(pincode: string): boolean {
  if (!pincode) return false;
  const clean = pincode.trim();
  return (NON_SERVICEABLE_PINCODES as readonly string[]).includes(clean);
}

/** Check if a pincode is within our serviceable delivery zones */
export function isValidPincode(pincode: string): boolean {
  if (!pincode) return false;
  const clean = pincode.trim();
  if (isNonServiceablePincode(clean)) return false;
  return clean in DELIVERY_ZONES;
}

/**
 * Calculate delivery charge based on order value:
 * - Above ₹299: FREE Delivery (₹0)
 * - ₹199 to ₹299 (inclusive): ₹30 delivery charge
 * - Below ₹199: ₹30 (order placement blocked by minimum order validation)
 */
export function calculateDeliveryCharge(orderValue: number): number {
  if (orderValue > FREE_DELIVERY_THRESHOLD) {
    return 0; // FREE Delivery
  }
  return STANDARD_DELIVERY_CHARGE; // ₹30 delivery charge
}

/** Get delivery zone details for a pincode */
export function getDeliveryZone(pincode: string): DeliveryZone | null {
  const clean = pincode.trim();
  if (isNonServiceablePincode(clean)) return null;
  return DELIVERY_ZONES[clean] ?? null;
}

/** Get delivery charge for a pincode and optional order value */
export function getDeliveryCharge(pincode: string, orderValue?: number): number | null {
  const clean = pincode.trim();
  if (!isValidPincode(clean)) return null;
  if (orderValue !== undefined) {
    return calculateDeliveryCharge(orderValue);
  }
  return STANDARD_DELIVERY_CHARGE;
}

/** Get minimum order for a pincode */
export function getMinimumOrder(_pincode?: string): number {
  return MINIMUM_ORDER_VALUE;
}

/** Return all available service pincodes list */
export function getServiceablePincodes(): string[] {
  return Object.keys(DELIVERY_ZONES);
}
