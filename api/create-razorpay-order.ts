// Vercel Serverless Function: /api/create-razorpay-order
// Creates a Razorpay Order securely using RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.
// Explicitly enables payment_capture: 1 (automatic capture) and attaches customer metadata.
import { handleCors, parseApiRequest, sendApiResponse } from "./_catalog";
import { getSupabaseServerClient } from "./_supabase";

export default async function handler(req: any, res?: any): Promise<any> {
  if (handleCors(req, res)) {
    return;
  }

  const { method, body } = await parseApiRequest(req);

  if (method !== "POST") {
    return sendApiResponse(res, 405, { error: "Method not allowed. Use POST." });
  }

  try {
    const {
      amount,
      receipt,
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      currency = "INR",
    } = body || {};

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TU0lWbkyOmj5C5";
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return sendApiResponse(res, 200, {
        configured: false,
        message: "RAZORPAY_KEY_SECRET not set in server environment. Client test checkout will be used.",
      });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const targetOrderId = String(orderId || receipt || `rcpt_${Date.now()}`);
    // Razorpay enforces maximum receipt length of 40 characters
    const cleanReceipt = targetOrderId.slice(0, 40);

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // in paise
        currency,
        receipt: cleanReceipt,
        payment_capture: 1, // Explicit automatic capture: prevents late authorization auto-refunds
        notes: {
          storefrontOrderId: targetOrderId,
          customerName: String(customerName || "").slice(0, 50),
          customerPhone: String(customerPhone || "").slice(0, 30),
          customerEmail: String(customerEmail || "").slice(0, 50),
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errData = await razorpayResponse.json().catch(() => ({}));
      console.error("[create-razorpay-order] Razorpay Orders API error:", errData);
      return sendApiResponse(res, razorpayResponse.status, {
        error: "Razorpay API error",
        details: errData,
      });
    }

    const orderData = await razorpayResponse.json();

    // Immediately update Supabase pending order with the newly generated razorpay_order_id
    try {
      const supabase = getSupabaseServerClient();
      if (supabase && targetOrderId && orderData.id) {
        await supabase
          .from("orders")
          .update({ razorpay_order_id: orderData.id })
          .eq("id", targetOrderId);
        console.info(`[create-razorpay-order] Linked Razorpay Order ID ${orderData.id} to storefront order #${targetOrderId}`);
      }
    } catch (dbErr) {
      console.warn("[create-razorpay-order] Supabase update warning:", dbErr);
    }

    return sendApiResponse(res, 200, {
      configured: true,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
    });
  } catch (err) {
    return sendApiResponse(res, 500, {
      error: err instanceof Error ? err.message : "Internal Server Error",
    });
  }
}
