import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type { Product } from "../data/products";
import { getItem, setItem, STORAGE_KEYS } from "../utils/storage";
import {
  calculateDeliveryCharge,
  calculateDiscount,
  type DiscountResult,
  MINIMUM_ORDER_VALUE,
} from "../utils/price";
import { useProductCatalog } from "./ProductContext";
import { fetchLiveProducts } from "../services/productService";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ToastNotification {
  id: number;
  message: string;
  type: "add" | "remove";
}

export interface PriceChangeAlert {
  id: string;
  name: string;
  oldPrice: number;
  newPrice: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD"; product: Product }
  | { type: "REMOVE"; productId: string }
  | { type: "INCREMENT"; productId: string }
  | { type: "DECREMENT"; productId: string }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "SYNC_LIVE_PRICES"; items: CartItem[] };

// ── Reducer ──────────────────────────────────────────────────────────────────

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
    case "SYNC_LIVE_PRICES":
      return { items: action.items };

    case "ADD": {
      const existing = state.items.find(
        (i) => i.product.id === action.product.id
      );
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: 1 }] };
    }

    case "REMOVE":
      return {
        items: state.items.filter((i) => i.product.id !== action.productId),
      };

    case "INCREMENT":
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      };

    case "DECREMENT": {
      const item = state.items.find((i) => i.product.id === action.productId);
      if (!item) return state;
      if (item.quantity <= 1) {
        return {
          items: state.items.filter((i) => i.product.id !== action.productId),
        };
      }
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        ),
      };
    }

    case "CLEAR":
      return { items: [] };

    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────────────────────────

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  isMinimumMet: boolean;
  discount: DiscountResult;
  discountedSubtotal: number;
  toast: ToastNotification | null;
  priceChangeAlerts: PriceChangeAlert[];
  dismissPriceAlert: (productId?: string) => void;
  syncCartWithLivePrices: () => Promise<{ hasChanges: boolean; changedItems: PriceChangeAlert[] }>;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [priceChangeAlerts, setPriceChangeAlerts] = useState<PriceChangeAlert[]>([]);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { products: liveCatalog } = useProductCatalog();

  // Trigger modern top snackbar
  const triggerToast = useCallback((message: string, type: "add" | "remove") => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ id: Date.now(), message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3500);
  }, []);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = getItem<CartItem[]>(STORAGE_KEYS.CART, []);
    if (saved.length > 0) {
      dispatch({ type: "HYDRATE", items: saved });
    }
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    setItem(STORAGE_KEYS.CART, state.items);
  }, [state.items]);

  // Synchronize cart items against a given product catalog
  const syncItemsAgainstCatalog = useCallback(
    (catalog: Product[]) => {
      if (!catalog || catalog.length === 0 || state.items.length === 0) {
        return { hasChanges: false, changedItems: [] };
      }

      const detectedAlerts: PriceChangeAlert[] = [];
      let hasModifications = false;

      const updatedItems = state.items.map((item) => {
        const live = catalog.find((p) => p.id === item.product.id);
        if (!live) return item;

        const livePrice = Number(live.price);
        const currentPrice = Number(item.product.price);

        if (livePrice !== currentPrice) {
          detectedAlerts.push({
            id: live.id,
            name: live.name,
            oldPrice: currentPrice,
            newPrice: livePrice,
          });
          hasModifications = true;
          return {
            ...item,
            product: {
              ...live,
              price: livePrice,
            },
          };
        }

        // Sync inStock and stock limit if changed
        if (
          live.inStock !== item.product.inStock ||
          live.stockQuantity !== item.product.stockQuantity ||
          live.name !== item.product.name
        ) {
          hasModifications = true;
          return {
            ...item,
            product: live,
          };
        }

        return item;
      });

      if (hasModifications) {
        dispatch({ type: "SYNC_LIVE_PRICES", items: updatedItems });

        if (detectedAlerts.length > 0) {
          setPriceChangeAlerts((prev) => {
            const merged = [...prev];
            for (const alert of detectedAlerts) {
              const idx = merged.findIndex((a) => a.id === alert.id);
              if (idx >= 0) merged[idx] = alert;
              else merged.push(alert);
            }
            return merged;
          });

          triggerToast(
            `⚠️ The price of ${detectedAlerts.map((a) => a.name).join(", ")} has been updated. Your cart has been updated to the latest price.`,
            "remove"
          );
        }
      }

      return { hasChanges: detectedAlerts.length > 0, changedItems: detectedAlerts };
    },
    [state.items, triggerToast]
  );

  // Auto-sync whenever live catalog in ProductContext updates
  useEffect(() => {
    if (liveCatalog && liveCatalog.length > 0 && state.items.length > 0) {
      syncItemsAgainstCatalog(liveCatalog);
    }
  }, [liveCatalog, syncItemsAgainstCatalog, state.items.length]);

  // Explicit sync triggered when cart or checkout mounts or refreshes
  const syncCartWithLivePrices = useCallback(async () => {
    try {
      const liveProducts = await fetchLiveProducts();
      if (!liveProducts || liveProducts.length === 0) {
        return { hasChanges: false, changedItems: [] };
      }
      return syncItemsAgainstCatalog(liveProducts);
    } catch (err) {
      console.warn("[CartContext] syncCartWithLivePrices error:", err);
      return { hasChanges: false, changedItems: [] };
    }
  }, [syncItemsAgainstCatalog]);

  const dismissPriceAlert = useCallback((productId?: string) => {
    if (!productId) {
      setPriceChangeAlerts([]);
    } else {
      setPriceChangeAlerts((prev) => prev.filter((a) => a.id !== productId));
    }
  }, []);

  const addItem = useCallback(
    (product: Product) => {
      // 1. Out of stock guard
      if (
        product.inStock === false ||
        (product.stockQuantity !== undefined && product.stockQuantity <= 0)
      ) {
        triggerToast(`⚠️ Sorry, ${product.name} is out of stock`, "remove");
        return;
      }

      // 2. Stock limit guard
      const existing = state.items.find((i) => i.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      if (product.stockQuantity !== undefined && currentQty >= product.stockQuantity) {
        triggerToast(
          `⚠️ Only ${product.stockQuantity} unit${product.stockQuantity === 1 ? "" : "s"} available in stock`,
          "remove"
        );
        return;
      }

      dispatch({ type: "ADD", product });
      triggerToast(`✓ ${product.name} added to cart`, "add");
    },
    [state.items, triggerToast]
  );

  const removeItem = useCallback(
    (productId: string) => {
      const item = state.items.find((i) => i.product.id === productId);
      const name = item ? item.product.name : "Item";
      dispatch({ type: "REMOVE", productId });
      dismissPriceAlert(productId);
      triggerToast(`✓ ${name} removed from cart`, "remove");
    },
    [state.items, triggerToast, dismissPriceAlert]
  );

  const incrementItem = useCallback(
    (productId: string) => {
      const item = state.items.find((i) => i.product.id === productId);
      if (item) {
        // Stock limit guard
        if (
          item.product.stockQuantity !== undefined &&
          item.quantity >= item.product.stockQuantity
        ) {
          triggerToast(
            `⚠️ Maximum available stock reached (${item.product.stockQuantity} units)`,
            "remove"
          );
          return;
        }

        triggerToast(`✓ ${item.product.name} added to cart`, "add");
      }
      dispatch({ type: "INCREMENT", productId });
    },
    [state.items, triggerToast]
  );

  const decrementItem = useCallback(
    (productId: string) => {
      const item = state.items.find((i) => i.product.id === productId);
      if (item) {
        if (item.quantity === 1) {
          triggerToast(`✓ ${item.product.name} removed from cart`, "remove");
          dismissPriceAlert(productId);
        }
      }
      dispatch({ type: "DECREMENT", productId });
    },
    [state.items, triggerToast, dismissPriceAlert]
  );

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR" });
    setPriceChangeAlerts([]);
  }, []);

  const getItemQuantity = useCallback(
    (productId: string) =>
      state.items.find((i) => i.product.id === productId)?.quantity ?? 0,
    [state.items]
  );

  const itemCount = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  );

  const subtotal = useMemo(
    () =>
      state.items.reduce(
        (sum, i) => sum + Number(i.product.price || 0) * i.quantity,
        0
      ),
    [state.items]
  );

  // Delivery charge updates automatically whenever subtotal changes: > 299 is free, else 30
  const deliveryCharge = useMemo(() => calculateDeliveryCharge(subtotal), [subtotal]);

  // Total payable amount = subtotal + deliveryCharge
  const total = useMemo(() => subtotal + deliveryCharge, [subtotal, deliveryCharge]);

  const isMinimumMet = useMemo(() => subtotal >= MINIMUM_ORDER_VALUE, [subtotal]);

  const discount = useMemo(() => calculateDiscount(subtotal), [subtotal]);
  const discountedSubtotal = subtotal;

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      itemCount,
      subtotal,
      deliveryCharge,
      total,
      isMinimumMet,
      discount,
      discountedSubtotal,
      toast,
      priceChangeAlerts,
      dismissPriceAlert,
      syncCartWithLivePrices,
      addItem,
      removeItem,
      incrementItem,
      decrementItem,
      clearCart,
      getItemQuantity,
    }),
    [
      state.items,
      itemCount,
      subtotal,
      deliveryCharge,
      total,
      isMinimumMet,
      discount,
      discountedSubtotal,
      toast,
      priceChangeAlerts,
      dismissPriceAlert,
      syncCartWithLivePrices,
      addItem,
      removeItem,
      incrementItem,
      decrementItem,
      clearCart,
      getItemQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
