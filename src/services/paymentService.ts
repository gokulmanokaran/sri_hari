/**
 * Payment Service — Razorpay Test / Live Integration
 * ────────────────────────────────────────────────────
 * Handles opening Razorpay checkout modal, processing test payments,
 * handling success/failure/dismissal callbacks, and optional server-side verification.
 */

export interface PaymentPayload {
  orderId: string;
  amount: number; // in INR (rupees, not paise)
  currency?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  description: string;
}

export interface PaymentResult {
  success: boolean;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  error?: string;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata?: Record<string, unknown>;
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  order_id?: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: RazorpayFailureResponse) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

// Test Key ID provided for the application
const DEFAULT_RAZORPAY_KEY_ID = "rzp_test_TU0lWbkyOmj5C5";

export function getRazorpayKeyId(): string {
  return (
    (import.meta.env.VITE_RAZORPAY_KEY_ID as string) ||
    DEFAULT_RAZORPAY_KEY_ID
  );
}

/**
 * Dynamically load Razorpay SDK if not already loaded on window
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Optional server-side Razorpay Order Creator (used if backend secret is present)
 */
async function createBackendRazorpayOrder(amount: number, orderId: string): Promise<string | undefined> {
  try {
    const res = await fetch("/api/create-razorpay-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, receipt: orderId }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.orderId || undefined;
    }
  } catch {
    // Backend endpoint not active or in local preview; fallback to direct client checkout
  }
  return undefined;
}

/**
 * Process Razorpay payment for checkout
 */
export async function processPayment(payload: PaymentPayload): Promise<PaymentResult> {
  const isScriptLoaded = await loadRazorpayScript();
  if (!isScriptLoaded || !window.Razorpay) {
    return {
      success: false,
      error: "Unable to load Razorpay payment gateway. Please check your internet connection.",
    };
  }

  const razorpayKey = getRazorpayKeyId();
  if (!razorpayKey) {
    return {
      success: false,
      error: "Razorpay Key ID is not configured.",
    };
  }

  // Attempt backend order generation if available
  const backendOrderId = await createBackendRazorpayOrder(payload.amount, payload.orderId);

  return new Promise((resolve) => {
    let isHandled = false;

    const options: RazorpayOptions = {
      key: razorpayKey,
      amount: Math.round(payload.amount * 100), // Amount in paise
      currency: payload.currency || "INR",
      name: "Shree Hari Keerai",
      description: payload.description || `Order #${payload.orderId}`,
      order_id: backendOrderId,
      prefill: {
        name: payload.customerName,
        email: payload.customerEmail || undefined,
        contact: payload.customerPhone,
      },
      notes: {
        storefrontOrderId: payload.orderId,
      },
      theme: {
        color: "#00A651",
      },
      handler: async (response: RazorpaySuccessResponse) => {
        if (isHandled) return;
        isHandled = true;

        // Verify with backend endpoint if available
        try {
          const verifyRes = await fetch("/api/verify-razorpay-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id || backendOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            if (verifyData.verified === false) {
              resolve({
                success: false,
                error: "Payment verification failed. Please contact support.",
              });
              return;
            }
          }
        } catch {
          // Fallback: Proceed with Razorpay client confirmation
        }

        resolve({
          success: true,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id || backendOrderId,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          if (isHandled) return;
          isHandled = true;
          resolve({
            success: false,
            error: "Payment was cancelled. You can retry when ready.",
          });
        },
      },
    };

    if (!window.Razorpay) {
      resolve({
        success: false,
        error: "Razorpay payment SDK is not initialized.",
      });
      return;
    }

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", (response: RazorpayFailureResponse) => {
      if (isHandled) return;
      isHandled = true;
      const errorMsg =
        response.error?.description ||
        response.error?.reason ||
        "Payment failed. Please try a different payment method.";
      resolve({
        success: false,
        error: errorMsg,
      });
    });

    rzp.open();
  });
}
