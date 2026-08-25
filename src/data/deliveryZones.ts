// Centralized delivery zone configuration
// Maps Coimbatore service pincodes → { charge, minimumOrder }

export interface DeliveryZone {
  charge: number;       // Delivery charge in ₹
  minimumOrder: number; // Minimum order value in ₹
  zoneName?: string;
}

// Zone A — ₹30 delivery, ₹199 minimum order (Central / Express Zones)
const ZONE_A: DeliveryZone = { charge: 30, minimumOrder: 199, zoneName: "Central Coimbatore" };

// Zone B — ₹50 delivery, ₹249 minimum order (Suburbs / Extended City)
const ZONE_B: DeliveryZone = { charge: 50, minimumOrder: 249, zoneName: "Coimbatore Suburbs" };

// Zone C — ₹80 delivery, ₹299 minimum order (Peripheral Zones)
const ZONE_C: DeliveryZone = { charge: 80, minimumOrder: 299, zoneName: "Outer Coimbatore" };

export const DELIVERY_ZONES: Record<string, DeliveryZone> = {
  // ── Zone A (₹30 charge, min ₹199) ──────────────────────────────────────────
  "641001": ZONE_A, // Coimbatore Town / Town Hall
  "641002": ZONE_A, // R.S. Puram
  "641003": ZONE_A, // R.S. Puram West
  "641004": ZONE_A, // Peelamedu
  "641012": ZONE_A, // Gandhipuram / Cross Cut Road
  "641014": ZONE_A, // Peelamedu / Aerodrome / SITRA
  "641018": ZONE_A, // Ramanathapuram
  "641037": ZONE_A, // Pappanaickenpalayam (PN Palayam)
  "641044": ZONE_A, // Siddhapudur / New Siddhapudur
  "641048": ZONE_A, // Goldwins / Civil Aerodrome
  "641051": ZONE_A, // Kovaipudur

  // ── Zone B (₹50 charge, min ₹249) ──────────────────────────────────────────
  "641005": ZONE_B, // Singanallur
  "641006": ZONE_B, // Ganapathy
  "641015": ZONE_B, // Uppilipalayam
  "641028": ZONE_B, // Sowripalayam / Meena Estate
  "641035": ZONE_B, // Saravanampatti / IT Park
  "641045": ZONE_B, // Ondipudur
  "641049": ZONE_B, // Kalapatti
  "641062": ZONE_B, // Neelambur
  "641107": ZONE_B, // Sulur

  // ── Zone C (₹80 charge, min ₹299) ──────────────────────────────────────────
  "641008": ZONE_C, // Kuniyamuthur
  "641016": ZONE_C, // Irugur
  "641020": ZONE_C, // Vadavalli
  "641025": ZONE_C, // Perur
  "641026": ZONE_C, // Thudiyalur
  "641041": ZONE_C, // Vadavalli West / Marudhamalai Road
};

/** Fallback global minimum (used before a location is pinned) */
export const DEFAULT_MINIMUM_ORDER = 199;

export const BUSINESS_PHONE = "8438758801";

/** Get delivery zone details for a pincode */
export function getDeliveryZone(pincode: string): DeliveryZone | null {
  const clean = pincode.trim();
  return DELIVERY_ZONES[clean] ?? null;
}

/** Get delivery charge for a pincode */
export function getDeliveryCharge(pincode: string): number | null {
  const clean = pincode.trim();
  return DELIVERY_ZONES[clean]?.charge ?? null;
}

/** Get minimum order for a pincode */
export function getMinimumOrder(pincode: string): number {
  const clean = pincode.trim();
  return DELIVERY_ZONES[clean]?.minimumOrder ?? DEFAULT_MINIMUM_ORDER;
}

/** Check if a pincode is within our serviceable delivery zones */
export function isValidPincode(pincode: string): boolean {
  if (!pincode) return false;
  const clean = pincode.trim();
  return clean in DELIVERY_ZONES;
}

/** Return all available service pincodes list */
export function getServiceablePincodes(): string[] {
  return Object.keys(DELIVERY_ZONES);
}
