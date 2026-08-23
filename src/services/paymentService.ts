/**
 * Payment Service — Razorpay Ready
 * ─────────────────────────────────
 * This module is the single point of payment processing for the app.
 * When Razorpay credentials are available, replace the `processPayment`
 * body with the Razorpay SDK invocation shown in the commented block below.
 *
 * The CheckoutPage only calls `processPayment(payload)` — it never
 * needs to be changed when switching from simulation to live Razorpay.
 */

export interface PaymentPayload {
  orderId: string;
  amount: number; // in INR (rupees, not paise)
  currency: string;
  customerName: string;
  customerEmail: string;
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

/**
 * Process payment for a given order.
 *
 * Currently simulates a successful payment with a short delay.
 *
 * To connect Razorpay:
 * 1. Add your Razorpay Key ID as: VITE_RAZORPAY_KEY_ID=rzp_live_xxxx in .env
 * 2. Uncomment the Razorpay block below and remove the simulation block.
 */
export async function processPayment(payload: PaymentPayload): Promise<PaymentResult> {
  // ── SIMULATION (remove when Razorpay is live) ──────────────────────────────
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    success: true,
    razorpayPaymentId: `sim_pay_${Date.now()}`,
    razorpayOrderId: payload.orderId,
  };
  // ── END SIMULATION ─────────────────────────────────────────────────────────

  // ── RAZORPAY INTEGRATION (uncomment when ready) ────────────────────────────
  // return new Promise((resolve) => {
  //   const options = {
  //     key: import.meta.env.VITE_RAZORPAY_KEY_ID,
  //     amount: payload.amount * 100, // Razorpay expects paise
  //     currency: payload.currency || "INR",
  //     name: "Shree Hari Keerai",
  //     description: payload.description,
  //     order_id: payload.orderId, // Razorpay order ID from your backend
  //     prefill: {
  //       name: payload.customerName,
  //       email: payload.customerEmail,
  //       contact: payload.customerPhone,
  //     },
  //     theme: { color: "#00A651" },
  //     handler: (response: {
  //       razorpay_payment_id: string;
  //       razorpay_order_id: string;
  //       razorpay_signature: string;
  //     }) => {
  //       resolve({
  //         success: true,
  //         razorpayPaymentId: response.razorpay_payment_id,
  //         razorpayOrderId: response.razorpay_order_id,
  //         razorpaySignature: response.razorpay_signature,
  //       });
  //     },
  //     modal: {
  //       ondismiss: () => resolve({ success: false, error: "Payment cancelled by user." }),
  //     },
  //   };
  //   const rzp = new (window as Window & { Razorpay: new (opts: unknown) => { open(): void } }).Razorpay(options);
  //   rzp.open();
  // });
  // ── END RAZORPAY ───────────────────────────────────────────────────────────
}
