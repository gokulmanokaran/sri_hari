// Vercel Serverless Function: /api/create-razorpay-order
// ──────────────────────────────────────────────────────────────────────────────
// Creates an official Razorpay Order securely using RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.
// Explicitly enforces payment_capture: 1 (automatic capture) and attaches customer metadata.
// 100% self-contained for Vercel Serverless (no relative import failures).
// ──────────────────────────────────────────────────────────────────────────────

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ── Supabase Client (Self-Contained) ───────────────────────────────────────────
const DEFAULT_SUPABASE_URL = "https://wgcfkijbgnokeoolajwz.supabase.co";
const DEFAULT_SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnY2ZraWpiZ25va2Vvb2xhand6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzMxMTk5MiwiZXhwIjoyMTAyODg3OTkyfQ.vODVW6mMX3Ld2ux4SaVmIJVH8meh2BDnXaEubmOiDLk";

let _supabaseServerClient: SupabaseClient | null = null;

function getSupabaseServerClient(): SupabaseClient | null {
  if (_supabaseServerClient) return _supabaseServerClient;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_SERVICE_KEY;

  if (url && key) {
    try {
      _supabaseServerClient = createClient(url, key, { auth: { persistSession: false } });
      return _supabaseServerClient;
    } catch (err) {
      console.warn("[create-razorpay-order] Supabase init error:", err);
    }
  }
  return null;
}

// ── Request & Response Helpers (Self-Contained) ────────────────────────────────
function handleCors(req: any, res?: any): boolean {
  if (res && typeof res.setHeader === "function") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-razorpay-signature");
  }
  if ((req.method || "").toUpperCase() === "OPTIONS") {
    if (res && typeof res.status === "function") res.status(200).end();
    return true;
  }
  return false;
}

async function parseApiRequest(req: any) {
  const method = (req.method || "GET").toUpperCase();
  const headers: Record<string, string> = {};
  if (req.headers) {
    if (typeof req.headers.forEach === "function") {
      req.headers.forEach((v: string, k: string) => { headers[k.toLowerCase()] = v; });
    } else {
      for (const k in req.headers) headers[k.toLowerCase()] = String(req.headers[k]);
    }
  }
  const getHeader = (n: string) => headers[n.toLowerCase()];
  let body: any = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { /* keep */ }
  } else if (!body && typeof req.json === "function") {
    try { body = await req.json(); } catch { body = {}; }
  } else if (!body && req.on && method !== "GET" && method !== "HEAD") {
    body = await new Promise((resolve) => {
      let d = "";
      req.on("data", (c: any) => { d += c; });
      req.on("end", () => {
        try { resolve(JSON.parse(d || "{}")); } catch { resolve({}); }
      });
      req.on("error", () => resolve({}));
    });
  }
  return { method, body: body || {}, getHeader };
}

function sendApiResponse(res: any, status: number, data: any): any {
  if (res && typeof res.status === "function" && typeof res.setHeader === "function") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    return res.status(status).json(data);
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// ── Main Handler ──────────────────────────────────────────────────────────────

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

    if (!amount || Number(amount) <= 0) {
      return sendApiResponse(res, 400, {
        success: false,
        error: "Invalid amount. An order amount greater than 0 is required.",
      });
    }

    const keyId =
      process.env.RAZORPAY_KEY_ID ||
      process.env.VITE_RAZORPAY_KEY_ID ||
      "rzp_live_TVqupLsjlS8bW6";

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error(
        "[create-razorpay-order] ❌ CRITICAL: RAZORPAY_KEY_SECRET is not configured in environment variables!"
      );
      return sendApiResponse(res, 500, {
        success: false,
        error: "Server configuration error: RAZORPAY_KEY_SECRET is not configured in Vercel environment variables. Orders cannot be initialized without server credentials.",
      });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const targetOrderId = String(orderId || receipt || `rcpt_${Date.now()}`);
    // Razorpay enforces maximum receipt length of 40 characters
    const cleanReceipt = targetOrderId.slice(0, 40);

    console.info(
      `[create-razorpay-order] 🚀 Calling Razorpay Orders API for #${targetOrderId} | Amount: ₹${amount} (${Math.round(Number(amount) * 100)} paise)`
    );

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
        payment_capture: 1, // Explicit automatic capture: forces auto-capture in Razorpay
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
      console.error("[create-razorpay-order] ❌ Razorpay Orders API rejected request:", errData);
      return sendApiResponse(res, razorpayResponse.status, {
        success: false,
        error: errData?.error?.description || "Razorpay API error creating order",
        details: errData,
      });
    }

    const orderData = await razorpayResponse.json();

    if (!orderData?.id || !orderData.id.startsWith("order_")) {
      console.error("[create-razorpay-order] ❌ Razorpay returned response without valid order_id:", orderData);
      return sendApiResponse(res, 500, {
        success: false,
        error: "Razorpay did not return a valid Order ID.",
      });
    }

    console.info(`[create-razorpay-order] ✅ Razorpay Order created successfully: ${orderData.id}`);

    // Immediately save razorpay_order_id in Supabase pending order record
    try {
      const supabase = getSupabaseServerClient();
      if (supabase && targetOrderId) {
        await supabase
          .from("orders")
          .update({ razorpay_order_id: orderData.id })
          .eq("id", targetOrderId);
        console.info(`[create-razorpay-order] 🔗 Linked Razorpay Order ID ${orderData.id} to storefront order #${targetOrderId}`);
      }
    } catch (dbErr) {
      console.warn("[create-razorpay-order] Supabase update warning:", dbErr);
    }

    return sendApiResponse(res, 200, {
      success: true,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      receipt: orderData.receipt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[create-razorpay-order] Exception:", err);
    return sendApiResponse(res, 500, {
      success: false,
      error: msg,
    });
  }
}
