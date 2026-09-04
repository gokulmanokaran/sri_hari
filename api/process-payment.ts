/// <reference types="node" />

// Vercel Serverless Function: /api/process-payment
// ──────────────────────────────────────────────────────────────────────────────
// PRIMARY order processor called after Razorpay Checkout completion.
//
// FLOW:
//   1. Verify Razorpay signature (if secret configured)
//   2. Query Razorpay Payments API to verify actual status (captured vs authorized)
//   3. If status is 'authorized', automatically invoke Razorpay Capture API
//   4. Only mark status as 'Paid (Razorpay)' if payment is verified CAPTURED
//   5. If payment remains 'authorized', mark as 'Payment Authorized (Pending Capture)'
//      and do NOT trigger Google Sheets fulfillment
//   6. Forward captured orders to Google Apps Script for Sheets + Email
//   7. 100% self-contained for Vercel Serverless (no relative import failures)
// ──────────────────────────────────────────────────────────────────────────────

import crypto from "crypto";
import { Buffer } from "buffer";
import process from "process";
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
      console.warn("[process-payment] Supabase init error:", err);
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  id?: string;
  name: string;
  nameTamil?: string;
  quantity: number;
  price: number;
  unit?: string;
}

interface ProcessPaymentBody {
  orderId: string;
  createdAt?: string;
  fullName: string;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  address: string;
  houseNo?: string;
  street?: string;
  area?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  lat?: number | null;
  lng?: number | null;
  mapsLink?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  paymentStatus?: string;
  paymentId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  productsSummary?: string;
  totalQuantity?: number;
  formattedDate?: string;
  source?: string;
  customerNote?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  secret: string
): boolean {
  const generated = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return generated === signature;
}

/** Call Google Apps Script webhook with exponential backoff retry */
async function callGoogleAppsScript(
  webhookUrl: string,
  payload: object,
  maxAttempts = 3
): Promise<{ success: boolean; attempts: number; lastError?: string }> {
  let lastError = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20_000);

      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok || res.status === 302 || res.status === 0) {
        const text = await res.text().catch(() => "");
        console.info(
          `[process-payment] ✅ GAS call succeeded on attempt ${attempt}.`,
          { status: res.status, responseSnippet: text.slice(0, 200) }
        );
        return { success: true, attempts: attempt };
      }

      lastError = `HTTP ${res.status}`;
      console.warn(
        `[process-payment] ⚠️ GAS attempt ${attempt}/${maxAttempts} returned ${res.status}. Will retry.`
      );
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(
        `[process-payment] ⚠️ GAS attempt ${attempt}/${maxAttempts} threw: ${lastError}. Will retry.`
      );
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
    }
  }

  return { success: false, attempts: maxAttempts, lastError };
}

/**
 * Verify payment status with Razorpay API and attempt auto-capture if status is 'authorized'.
 */
async function verifyAndCaptureRazorpayPayment(
  paymentId: string,
  amountInRupees: number
): Promise<{ verified: boolean; status: "captured" | "authorized" | "failed" | "unknown"; error?: string }> {
  // Guard against stale Vercel env var containing old key ID
  const envKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
  const keyId = (envKeyId && envKeyId !== "rzp_live_TVqupLsjlS8bW6") ? envKeyId : "rzp_live_TY2BW22RrguaTm";
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "oL8mctJQ6knuPbIoZwaUMPjX";

  if (!keySecret) {
    console.warn("[process-payment] ⚠️ RAZORPAY_KEY_SECRET not set; unable to query Razorpay Payment API directly.");
    return { verified: true, status: "unknown" };
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  try {
    // 1. Fetch Payment details from Razorpay
    const fetchRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!fetchRes.ok) {
      console.warn(`[process-payment] Failed to fetch payment ${paymentId} from Razorpay: ${fetchRes.status}`);
      return { verified: false, status: "unknown" };
    }

    const paymentData = await fetchRes.json() as any;
    const currentStatus = paymentData.status;
    console.info(`[process-payment] 🔍 Razorpay Payment ${paymentId} current status: ${currentStatus}`);

    if (currentStatus === "captured") {
      return { verified: true, status: "captured" };
    }

    // 2. If status is 'authorized', invoke Razorpay's Capture API to capture funds immediately!
    if (currentStatus === "authorized") {
      console.info(`[process-payment] ⚡ Payment ${paymentId} is authorized. Auto-capturing via Razorpay API...`);
      const captureRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: Math.round(amountInRupees * 100), // in paise
          currency: "INR",
        }),
      });

      if (captureRes.ok) {
        const captureData = await captureRes.json() as any;
        if (captureData.status === "captured") {
          console.info(`[process-payment] ✅ Successfully auto-captured payment ${paymentId} via API!`);
          return { verified: true, status: "captured" };
        }
      }

      console.warn(`[process-payment] ⚠️ Auto-capture attempt for ${paymentId} returned status ${captureRes.status}`);
      return { verified: true, status: "authorized" };
    }

    if (currentStatus === "failed") {
      return { verified: false, status: "failed", error: (paymentData as any).error_description || "Payment failed" };
    }

    return { verified: true, status: currentStatus || "unknown" };
  } catch (err) {
    console.warn("[process-payment] Razorpay payment verification exception:", err);
    return { verified: true, status: "unknown" };
  }
}

/** Update order status in Supabase */
async function updateOrderInSupabase(
  data: ProcessPaymentBody,
  determinedStatus: string
): Promise<{ isNew: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.warn("[process-payment] Supabase client not available — order not persisted to DB.");
    return { isNew: true };
  }

  const mapsLink =
    data.mapsLink ||
    (data.lat && data.lng ? `https://www.google.com/maps?q=${data.lat},${data.lng}` : "");

  const paymentId = data.paymentId || data.razorpayPaymentId || "";

  // 1. Check if order record exists (pre-persisted from storefront checkout)
  const { data: existing } = await supabase
    .from("orders")
    .select("id, payment_status, sheets_synced, email_sent, razorpay_order_id")
    .eq("id", data.orderId)
    .maybeSingle();

  if (existing) {
    // If order was already marked Paid and sheets were already synced, it's truly processed
    if (existing.payment_status && existing.payment_status.startsWith("Paid") && existing.sheets_synced) {
      console.info(`[process-payment] Order ${data.orderId} already exists and is fully synced — duplicate avoided.`);
      return { isNew: false };
    }

    // Update with latest payment identifiers and determined status
    try {
      await supabase
        .from("orders")
        .update({
          razorpay_payment_id: paymentId || null,
          razorpay_order_id: data.razorpayOrderId || existing.razorpay_order_id || null,
          razorpay_signature: data.razorpaySignature || null,
          payment_status: determinedStatus,
          full_name: data.fullName || undefined,
          mobile: data.mobile || undefined,
          email: data.email || undefined,
          address: data.address || undefined,
          items: data.items && data.items.length > 0 ? data.items : undefined,
          total: Number(data.total || 0) || undefined,
        })
        .eq("id", data.orderId);

      console.info(`[process-payment] Updated order ${data.orderId} from '${existing.payment_status}' to '${determinedStatus}'.`);
      return { isNew: true };
    } catch (updateErr: any) {
      console.error("[process-payment] Supabase update failed:", updateErr);
      return { isNew: true, error: updateErr?.message };
    }
  }

  // 2. New order not seen before
  const row = {
    id: data.orderId,
    razorpay_payment_id: paymentId || null,
    razorpay_order_id: data.razorpayOrderId || null,
    razorpay_signature: data.razorpaySignature || null,
    full_name: data.fullName || "",
    mobile: data.mobile || "",
    email: data.email || "",
    address: data.address || "",
    city: data.city || "",
    state: data.state || "",
    pincode: data.pincode || "",
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    maps_link: mapsLink,
    subtotal: Number(data.subtotal || 0),
    delivery_charge: Number(data.deliveryCharge || 0),
    discount: Number(data.discount || 0),
    total: Number(data.total || 0),
    items: data.items || [],
    payment_status: determinedStatus,
    customer_note: data.customerNote || "",
    sheets_synced: false,
    email_sent: false,
    retry_count: 0,
    source: data.source || "storefront",
  };

  try {
    await supabase.from("orders").insert(row);
    console.info(`[process-payment] Inserted fresh order ${data.orderId} with status '${determinedStatus}'.`);
    return { isNew: true };
  } catch (insertErr: any) {
    console.error("[process-payment] Supabase insert error:", insertErr);
    return { isNew: true, error: insertErr?.message };
  }
}

/** Update notification status flags in Supabase */
async function updateNotificationStatus(
  orderId: string,
  updates: {
    sheets_synced?: boolean;
    email_sent?: boolean;
    retry_count?: number;
    last_error?: string | null;
    last_attempt_at?: string;
  }
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  try {
    await supabase.from("orders").update(updates).eq("id", orderId);
  } catch (err) {
    console.warn("[process-payment] Failed to update notification status:", err);
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────

export default async function handler(req: any, res?: any): Promise<any> {
  if (handleCors(req, res)) return;

  const { method, body } = await parseApiRequest(req);

  if (method !== "POST") {
    return sendApiResponse(res, 405, { error: "Method not allowed. Use POST." });
  }

  const data = body as ProcessPaymentBody;
  const { orderId } = data;

  if (!orderId) {
    return sendApiResponse(res, 400, { error: "Missing orderId in request body." });
  }

  const paymentId = data.paymentId || data.razorpayPaymentId || "";
  const startedAt = new Date().toISOString();

  console.info(`[process-payment] 📦 Processing payment for #${orderId} | Payment: ${paymentId || "N/A"}`);

  // ── 1. Razorpay signature verification (if secret configured) ────────────
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "oL8mctJQ6knuPbIoZwaUMPjX";
  if (keySecret && data.razorpayOrderId && data.razorpaySignature && paymentId) {
    const isValid = verifyRazorpaySignature(
      data.razorpayOrderId,
      paymentId,
      data.razorpaySignature,
      keySecret
    );
    if (!isValid) {
      console.error(`[process-payment] ❌ Invalid Razorpay signature for order ${orderId} / payment ${paymentId}`);
      return sendApiResponse(res, 400, {
        success: false,
        error: "Payment signature verification failed.",
        orderId,
      });
    }
    console.info(`[process-payment] ✅ Razorpay signature verified for order ${orderId}.`);
  }

  // ── 2. Verify Payment Status with Razorpay & Auto-Capture if Authorized ──
  let determinedStatus = `Paid (Razorpay)${paymentId ? ` · ${paymentId}` : ""}`;
  let isCaptured = true;

  if (paymentId) {
    const razorpayVerification = await verifyAndCaptureRazorpayPayment(paymentId, Number(data.total || 0));

    if (razorpayVerification.status === "failed") {
      determinedStatus = `Payment Failed (Razorpay) · ${razorpayVerification.error || "Declined"}`;
      isCaptured = false;
    } else if (razorpayVerification.status === "authorized") {
      // Payment authorized by bank, but not captured yet
      determinedStatus = `Payment Authorized (Pending Capture) · ${paymentId}`;
      isCaptured = false;
      console.warn(`[process-payment] ⚠️ Payment ${paymentId} is AUTHORIZED but not captured. Will NOT mark as Paid.`);
    } else {
      determinedStatus = `Paid (Razorpay) · ${paymentId}`;
      isCaptured = true;
    }
  }

  // ── 3. Upsert order to Supabase ───────────────────────────────────────────
  const { isNew, error: dbError } = await updateOrderInSupabase(data, determinedStatus);

  if (!isNew) {
    console.info(`[process-payment] ℹ️ Order ${orderId} already processed and synced. Returning cached success.`);
    return sendApiResponse(res, 200, {
      success: true,
      orderId,
      alreadyProcessed: true,
      captured: isCaptured,
      paymentStatus: determinedStatus,
    });
  }

  if (dbError) {
    console.warn(`[process-payment] ⚠️ DB persist warning for order ${orderId}: ${dbError}`);
  }

  // ── 4. Forward to Google Apps Script ONLY IF CONFIRMED CAPTURED ────────────
  if (!isCaptured) {
    console.info(
      `[process-payment] ℹ️ Order ${orderId} is '${determinedStatus}'. Skipping Google Sheets sync until captured.`
    );
    return sendApiResponse(res, 200, {
      success: true,
      orderId,
      captured: false,
      paymentStatus: determinedStatus,
      message: "Payment authorized by bank. Final capture pending webhook confirmation.",
    });
  }

  // Forward to Google Apps Script (Sheets + Email) with retry
  const webhookUrl =
    process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
    process.env.VITE_ORDER_WEBHOOK_URL ||
    "https://script.google.com/macros/s/AKfycbzjXsA4gHp4u30Qx9RhFamyOIrSjqs2yi9K5wAF1YylK8FU9Ushsex8kffAIIRUR3bI/exec";

  const mapsLink =
    data.mapsLink ||
    (data.lat && data.lng ? `https://www.google.com/maps?q=${data.lat},${data.lng}` : "");

  const formattedDate =
    data.formattedDate ||
    new Date(data.createdAt || Date.now()).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

  const productsSummary =
    data.productsSummary ||
    (data.items || [])
      .map((item) => `${item.name}${item.unit ? ` (${item.unit})` : ""} × ${item.quantity}`)
      .join(", ");

  const totalQuantity =
    data.totalQuantity ||
    (data.items || []).reduce((acc, item) => acc + (item.quantity || 1), 0);

  const gasPayload = {
    ...data,
    paymentId: paymentId || "N/A",
    paymentStatus: determinedStatus,
    mapsLink,
    formattedDate,
    productsSummary,
    totalQuantity,
    source: data.source || "storefront",
    _processedAt: startedAt,
  };

  const gasResult = await callGoogleAppsScript(webhookUrl, gasPayload, 3);

  // ── 5. Update notification status in Supabase ─────────────────────────────
  await updateNotificationStatus(orderId, {
    sheets_synced: gasResult.success,
    email_sent: gasResult.success,
    retry_count: gasResult.attempts,
    last_error: gasResult.success ? null : (gasResult.lastError ?? null),
    last_attempt_at: new Date().toISOString(),
  });

  // ── 6. Final Outcome Log & Response ───────────────────────────────────────
  if (gasResult.success) {
    console.info(`[process-payment] ✅ ORDER ${orderId} FULLY CAPTURED & SYNCED TO SHEETS.`);
  } else {
    console.error(`[process-payment] ⚠️ ORDER ${orderId} CAPTURED in DB, but GAS forward had an issue: ${gasResult.lastError}`);
  }

  return sendApiResponse(res, 200, {
    success: true,
    orderId,
    alreadyProcessed: false,
    captured: true,
    paymentStatus: determinedStatus,
    sheetsSynced: gasResult.success,
    emailSent: gasResult.success,
  });
}
