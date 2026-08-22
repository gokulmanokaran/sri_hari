import { isValidPincode } from "../data/deliveryZones";

export function validatePincode(pincode: string): string | null {
  if (!pincode || pincode.trim() === "") return "Please enter your pincode.";
  if (!/^\d{6}$/.test(pincode.trim())) return "Please enter a valid 6-digit pincode.";
  return null;
}

export function validateLocationPin(lat: number | null, lng: number | null): string | null {
  if (lat === null || lng === null) return "Please select your delivery location on Google Maps.";
  if (lat === 0 && lng === 0) return "Please select a valid location on Google Maps.";
  return null;
}

// ── Checkout Form (Google Maps Pin Only) ──────────────────────────────────────

export interface CheckoutFormData {
  lat: number | null;
  lng: number | null;
  pincode: string;
}

export interface CheckoutErrors {
  location?: string;
}

export function validateCheckoutForm(data: CheckoutFormData): CheckoutErrors {
  const errors: CheckoutErrors = {};

  const locationErr = validateLocationPin(data.lat, data.lng);
  if (locationErr) errors.location = locationErr;

  return errors;
}

// ── Legacy helpers kept for other components (if needed) ──────────────────────
export function validatePhone(phone: string): string | null {
  if (!phone || phone.trim() === "") return "Please enter your mobile number.";
  const cleaned = phone.replace(/\s/g, "");
  if (!/^[6-9]\d{9}$/.test(cleaned))
    return "Please enter a valid 10-digit Indian mobile number.";
  return null;
}

export function validateName(name: string): string | null {
  if (!name || name.trim() === "") return "Please enter your full name.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  return null;
}

export function validateCheckoutPincode(pincode: string): string | null {
  const basic = validatePincode(pincode);
  if (basic) return basic;
  if (!isValidPincode(pincode.trim()))
    return "We don't deliver to this pincode yet.";
  return null;
}
