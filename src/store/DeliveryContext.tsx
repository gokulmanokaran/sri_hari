import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getDeliveryCharge,
  isValidPincode,
} from "../data/deliveryZones";
import { getItem, setItem, STORAGE_KEYS } from "../utils/storage";

// ── Types ────────────────────────────────────────────────────────────────────

interface DeliveryState {
  pincode: string;
  deliveryCharge: number | null;
  isAvailable: boolean;
  isChecked: boolean; // Has the user gone through pincode gate?
}

interface DeliveryContextValue extends DeliveryState {
  setPincode: (pincode: string) => void;
  checkPincode: (pincode: string) => { success: boolean; charge: number | null };
  clearPincode: () => void;
}

// ── Context ──────────────────────────────────────────────────────────────────

const DeliveryContext = createContext<DeliveryContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DeliveryState>(() => {
    const pincode = getItem<string>(STORAGE_KEYS.PINCODE, "");
    const deliveryCharge = getItem<number | null>(STORAGE_KEYS.DELIVERY_CHARGE, null);
    const isAvailable = getItem<boolean>(STORAGE_KEYS.DELIVERY_AVAILABLE, false);
    const isChecked = Boolean(pincode && isValidPincode(pincode));
    return { pincode, deliveryCharge, isAvailable, isChecked };
  });

  // Persist changes
  useEffect(() => {
    setItem(STORAGE_KEYS.PINCODE, state.pincode);
    setItem(STORAGE_KEYS.DELIVERY_CHARGE, state.deliveryCharge);
    setItem(STORAGE_KEYS.DELIVERY_AVAILABLE, state.isAvailable);
  }, [state]);

  const checkPincode = useCallback(
    (pincode: string): { success: boolean; charge: number | null } => {
      const charge = getDeliveryCharge(pincode.trim());
      const available = charge !== null;
      setState({
        pincode: pincode.trim(),
        deliveryCharge: charge,
        isAvailable: available,
        isChecked: true,
      });
      return { success: available, charge };
    },
    []
  );

  const setPincode = useCallback((pincode: string) => {
    const charge = getDeliveryCharge(pincode.trim());
    setState({
      pincode: pincode.trim(),
      deliveryCharge: charge,
      isAvailable: charge !== null,
      isChecked: true,
    });
  }, []);

  const clearPincode = useCallback(() => {
    setState({
      pincode: "",
      deliveryCharge: null,
      isAvailable: false,
      isChecked: false,
    });
  }, []);

  const value = useMemo<DeliveryContextValue>(
    () => ({ ...state, setPincode, checkPincode, clearPincode }),
    [state, setPincode, checkPincode, clearPincode]
  );

  return (
    <DeliveryContext.Provider value={value}>
      {children}
    </DeliveryContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useDelivery(): DeliveryContextValue {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error("useDelivery must be used inside DeliveryProvider");
  return ctx;
}
