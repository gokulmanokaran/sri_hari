import { isValidPincode } from "../data/deliveryZones";

export function validatePincode(pincode: string): string | null {
  if (!pincode || pincode.trim() === "") return "Please enter your pincode.";
  if (!/^\d{6}$/.test(pincode.trim())) return "Please enter a valid 6-digit pincode.";
  return null;
}

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

export function validateAddress(address: string): string | null {
  if (!address || address.trim() === "") return "Please enter your address.";
  if (address.trim().length < 10)
    return "Please enter a more complete address.";
  return null;
}

export function validateCity(city: string): string | null {
  if (!city || city.trim() === "") return "Please enter your city.";
  return null;
}

export function validateCheckoutPincode(pincode: string): string | null {
  const basic = validatePincode(pincode);
  if (basic) return basic;
  if (!isValidPincode(pincode.trim()))
    return "We don't deliver to this pincode yet.";
  return null;
}

export interface CheckoutFormData {
  name: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  pincode: string;
}

export interface CheckoutErrors {
  name?: string;
  phone?: string;
  address?: string;
  area?: string;
  city?: string;
  pincode?: string;
}

export function validateCheckoutForm(data: CheckoutFormData): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const nameErr = validateName(data.name);
  if (nameErr) errors.name = nameErr;
  const phoneErr = validatePhone(data.phone);
  if (phoneErr) errors.phone = phoneErr;
  const addressErr = validateAddress(data.address);
  if (addressErr) errors.address = addressErr;
  const cityErr = validateCity(data.city);
  if (cityErr) errors.city = cityErr;
  const pincodeErr = validateCheckoutPincode(data.pincode);
  if (pincodeErr) errors.pincode = pincodeErr;
  return errors;
}
