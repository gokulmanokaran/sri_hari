// Vercel Serverless Function: /api/razorpay-webhook
// ──────────────────────────────────────────────────────────────────────────────
// Comprehensive Razorpay Webhook Handler (Self-Contained for Vercel Serverless)
// Handles payment.captured, order.paid, payment.authorized, payment.failed, and refund events.
//
// Key Guarantees:
//   ✅ 4-tier resilient lookup: storefrontOrderId, razorpay_order_id, razorpay_payment_id, receipt
//   ✅ Automatically fulfills pre-persisted orders when captured/paid
//   ✅ Marks late authorization or authorized-only as "Payment Authorized (Pending Capture)" (NEVER as Paid)
//   ✅ Handles auto-refunds & standard refunds by updating status to "Refunded"
//   ✅ Idempotent: repeated webhook events for the same payment return 200 without duplicate actions
//   ✅ Forwards complete customer/item info to Google Apps Script
//   ✅ 100% self-contained: zero relative import failures on Vercel Node runtime
// ──────────────────────────────────────────────────────────────────────────────

import crypto from "crypto";
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
      console.warn("[razorpay-webhook] Supabase server client init error:", err);
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
    try { body = JSON.parse(body); } catch { /* keep string */ }
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

// ── Webhook Signature Verification ───────────────────────────────────────────

function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const generated = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(generated), Buffer.from(signature));
}

// ── GAS Forward with Retry ────────────────────────────────────────────────────

async function forwardToGoogleAppsScript(
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
        console.info(`[razorpay-webhook] ✅ GAS forwarded on attempt ${attempt}.`, text.slice(0, 100));
        return { success: true, attempts: attempt };
      }
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    console.warn(`[razorpay-webhook] ⚠️ GAS attempt ${attempt}/${maxAttempts} failed: ${lastError}`);
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, Math.pow(2, attempt - 1) * 1000));
    }
  }
  return { success: false, attempts: maxAttempts, lastError };
}

// ── Webhook Payload Interfaces ────────────────────────────────────────────────

interface RazorpayEntity {
  id: string;
  order_id?: string;
  payment_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  description?: string;
  contact?: string;
  email?: string;
  notes?: Record<string, string>;
  receipt?: string;
  error_code?: string;
  error_description?: string;
  error_reason?: string;
  created_at?: number;
}

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    payment?: { entity?: RazorpayEntity };
    order?: { entity?: RazorpayEntity };
    refund?: { entity?: RazorpayEntity };
  };
}

// ── Multi-tier Order Lookup in Supabase ───────────────────────────────────────

async function findOrderInSupabase(
  supabase: any,
  params: {
    candidateId?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    receipt?: string;
  }
): Promise<any | null> {
  const { candidateId, razorpayOrderId, razorpayPaymentId, receipt } = params;

  // 1. Primary match: by storefront order ID
  if (candidateId) {
    const { data } = await supabase.from("orders").select("*").eq("id", candidateId).maybeSingle();
    if (data) {
      console.info(`[razorpay-webhook] 🎯 Found order by candidate ID: ${candidateId}`);
      return data;
    }
  }

  // 2. Match by razorpay_order_id
  if (razorpayOrderId) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", razorpayOrderId)
      .maybeSingle();
    if (data) {
      console.info(`[razorpay-webhook] 🎯 Found order by razorpay_order_id: ${razorpayOrderId}`);
      return data;
    }
  }

  // 3. Match by receipt
  if (receipt) {
    const { data } = await supabase.from("orders").select("*").eq("id", receipt).maybeSingle();
    if (data) {
      console.info(`[razorpay-webhook] 🎯 Found order by receipt: ${receipt}`);
      return data;
    }
  }

  // 4. Match by razorpay_payment_id
  if (razorpayPaymentId) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("razorpay_payment_id", razorpayPaymentId)
      .maybeSingle();
    if (data) {
      console.info(`[razorpay-webhook] 🎯 Found order by razorpay_payment_id: ${razorpayPaymentId}`);
      return data;
    }
  }

  return null;
}

// ── Main Handler ──────────────────────────────────────────────────────────────

export default async function handler(req: any, res?: any): Promise<any> {
  if (handleCors(req, res)) return;

  const { method, body, getHeader } = await parseApiRequest(req);

  if (method !== "POST") {
    return sendApiResponse(res, 405, { error: "Method not allowed. Use POST." });
  }

  // ── 1. Reconstruct raw body for signature verification ────────────────────
  const rawBodyStr =
    typeof req.body === "string"
      ? req.body
      : JSON.stringify(body);

  // ── 2. Verify webhook signature ───────────────────────────────────────────
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const razorpaySignatureHeader = getHeader("x-razorpay-signature") || "";

  if (webhookSecret && razorpaySignatureHeader) {
    try {
      const isValid = verifyWebhookSignature(rawBodyStr, razorpaySignatureHeader, webhookSecret);
      if (!isValid) {
        console.error("[razorpay-webhook] ❌ Webhook signature verification FAILED — possible spoofing attempt.");
        return sendApiResponse(res, 400, { error: "Invalid webhook signature." });
      }
      console.info("[razorpay-webhook] ✅ Webhook signature verified.");
    } catch (err) {
      console.error("[razorpay-webhook] Signature verification exception:", err);
      return sendApiResponse(res, 400, { error: "Signature verification failed." });
    }
  } else if (!webhookSecret) {
    console.warn(
      "[razorpay-webhook] ⚠️ RAZORPAY_WEBHOOK_SECRET not set in environment — skipping signature check."
    );
  }

  const webhookData = body as RazorpayWebhookPayload;
  const eventType = webhookData?.event || "";

  console.info(`[razorpay-webhook] 📡 Received event: ${eventType}`);

  const paymentEntity = webhookData?.payload?.payment?.entity;
  const orderEntity = webhookData?.payload?.order?.entity;
  const refundEntity = webhookData?.payload?.refund?.entity;

  // Extract payment/order/receipt identifiers
  const razorpayPaymentId = paymentEntity?.id || refundEntity?.payment_id || "";
  const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id || "";
  const notes = paymentEntity?.notes || orderEntity?.notes || {};
  const storefrontCandidateId =
    notes.storefrontOrderId ||
    notes.orderId ||
    orderEntity?.receipt ||
    paymentEntity?.receipt ||
    "";
  const amountInPaise = paymentEntity?.amount || orderEntity?.amount || 0;
  const amountInRupees = amountInPaise > 0 ? amountInPaise / 100 : 0;

  const supabase = getSupabaseServerClient();
  let existingOrder: any = null;

  if (supabase) {
    existingOrder = await findOrderInSupabase(supabase, {
      candidateId: storefrontCandidateId,
      razorpayOrderId,
      razorpayPaymentId,
      receipt: orderEntity?.receipt || paymentEntity?.receipt,
    });
  }

  // ── Handle EVENT: payment.captured OR order.paid ──────────────────────────
  if (eventType === "payment.captured" || eventType === "order.paid") {
    console.info(
      `[razorpay-webhook] 💰 Processing Capture/Paid event: ${eventType} | Payment: ${razorpayPaymentId} | Order: ${razorpayOrderId}`
    );

    // If order was already marked Paid and sheets were already synced, return idempotent 200
    if (
      existingOrder &&
      existingOrder.payment_status &&
      existingOrder.payment_status.startsWith("Paid") &&
      existingOrder.sheets_synced
    ) {
      console.info(
        `[razorpay-webhook] ℹ️ Order ${existingOrder.id} is already marked Paid and synced. Idempotent 200.`
      );
      return sendApiResponse(res, 200, {
        received: true,
        event: eventType,
        processed: false,
        reason: "Already processed",
        orderId: existingOrder.id,
      });
    }

    const webhookUrl =
      process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
      process.env.VITE_ORDER_WEBHOOK_URL ||
      "https://script.google.com/macros/s/AKfycbzjXsA4gHp4u30Qx9RhFamyOIrSjqs2yi9K5wAF1YylK8FU9Ushsex8kffAIIRUR3bI/exec";

    const processedAt = new Date().toISOString();
    let gasPayload: Record<string, unknown>;
    const targetOrderId = existingOrder?.id || storefrontCandidateId || `SHK-WEBHOOK-${razorpayPaymentId}`;
    const paidStatus = `Paid (Razorpay) · ${razorpayPaymentId}`;

    if (existingOrder) {
      // Build complete notification from pre-persisted Supabase record (all customer details & items intact!)
      const mapsLink =
        existingOrder.maps_link ||
        (existingOrder.lat && existingOrder.lng
          ? `https://www.google.com/maps?q=${existingOrder.lat},${existingOrder.lng}`
          : "");

      const items = Array.isArray(existingOrder.items) ? existingOrder.items : [];
      const productsSummary = items
        .map((item: any) => `${item.name}${item.unit ? ` (${item.unit})` : ""} × ${item.quantity}`)
        .join(", ");
      const totalQuantity = items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
      const formattedDate = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      });

      gasPayload = {
        orderId: targetOrderId,
        fullName: existingOrder.full_name,
        mobile: existingOrder.mobile,
        email: existingOrder.email,
        address: existingOrder.address,
        city: existingOrder.city,
        state: existingOrder.state,
        pincode: existingOrder.pincode,
        lat: existingOrder.lat,
        lng: existingOrder.lng,
        mapsLink,
        items,
        subtotal: existingOrder.subtotal,
        deliveryCharge: existingOrder.delivery_charge,
        discount: existingOrder.discount,
        total: existingOrder.total,
        paymentStatus: paidStatus,
        paymentId: razorpayPaymentId,
        razorpayPaymentId,
        razorpayOrderId: razorpayOrderId || existingOrder.razorpay_order_id,
        productsSummary,
        totalQuantity,
        formattedDate,
        source: "razorpay-webhook",
        _webhookTriggered: true,
        _processedAt: processedAt,
      };

      // Transition order status to Paid in Supabase
      if (supabase) {
        await supabase
          .from("orders")
          .update({
            payment_status: paidStatus,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_order_id: razorpayOrderId || existingOrder.razorpay_order_id,
          })
          .eq("id", targetOrderId);
      }
    } else {
      // Fallback: If for any reason no pre-persisted order existed
      const formattedDate = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      });

      console.warn(
        `[razorpay-webhook] ⚠️ No pre-persisted Supabase record for order ${targetOrderId}. Using webhook payload metadata.`
      );

      gasPayload = {
        orderId: targetOrderId,
        fullName: notes.customerName || "Customer",
        mobile: notes.customerPhone || paymentEntity?.contact?.replace("+91", "") || "",
        email: notes.customerEmail || paymentEntity?.email || "",
        address: notes.address || "See Razorpay Dashboard",
        total: amountInRupees,
        subtotal: amountInRupees,
        deliveryCharge: 0,
        discount: 0,
        items: [],
        productsSummary: notes.productsSummary || "Order placed via Razorpay Checkout",
        totalQuantity: 1,
        paymentId: razorpayPaymentId,
        razorpayPaymentId,
        razorpayOrderId,
        paymentStatus: paidStatus,
        formattedDate,
        source: "razorpay-webhook-fallback",
        _webhookTriggered: true,
        _processedAt: processedAt,
      };

      if (supabase) {
        try {
          await supabase
            .from("orders")
            .insert({
              id: targetOrderId,
              razorpay_payment_id: razorpayPaymentId,
              razorpay_order_id: razorpayOrderId,
              full_name: gasPayload.fullName as string,
              mobile: gasPayload.mobile as string,
              email: gasPayload.email as string,
              address: gasPayload.address as string,
              subtotal: amountInRupees,
              delivery_charge: 0,
              discount: 0,
              total: amountInRupees,
              items: [],
              payment_status: paidStatus,
              sheets_synced: false,
              email_sent: false,
              source: "razorpay-webhook-fallback",
            });
        } catch (e) {
          console.warn("[razorpay-webhook] Fallback insert warning:", e);
        }
      }
    }

    // Forward to Google Apps Script for Sheets & Email notification
    const gasResult = await forwardToGoogleAppsScript(webhookUrl, gasPayload, 3);

    // Update sync status flags in Supabase
    if (supabase && targetOrderId) {
      try {
        await supabase
          .from("orders")
          .update({
            sheets_synced: gasResult.success,
            email_sent: gasResult.success,
            last_error: gasResult.success ? null : (gasResult.lastError ?? null),
            last_attempt_at: new Date().toISOString(),
          })
          .eq("id", targetOrderId);
      } catch (e) {
        console.warn("[razorpay-webhook] Sync update warning:", e);
      }
    }

    return sendApiResponse(res, 200, {
      received: true,
      event: eventType,
      processed: true,
      orderId: targetOrderId,
      paymentId: razorpayPaymentId,
      sheetsSynced: gasResult.success,
    });
  }

  // ── Handle EVENT: payment.authorized ──────────────────────────────────────
  // When bank authorizes payment, attempt immediate automatic capture via API!
  if (eventType === "payment.authorized") {
    console.info(`[razorpay-webhook] ⚡ payment.authorized received for ${razorpayPaymentId}. Attempting auto-capture via API...`);

    // Guard against stale Vercel env var containing old key ID
    const envKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
    const keyId = (envKeyId && envKeyId !== "rzp_live_TVqupLsjlS8bW6") ? envKeyId : "rzp_live_TY2BW22RrguaTm";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "oL8mctJQ6knuPbIoZwaUMPjX";
    let autoCaptured = false;

    if (keySecret && razorpayPaymentId && amountInPaise > 0) {
      try {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const capRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: "INR",
          }),
        });

        if (capRes.ok) {
          const capData = await capRes.json() as any;
          if (capData.status === "captured") {
            console.info(`[razorpay-webhook] ✅ Successfully auto-captured authorized payment ${razorpayPaymentId} via API!`);
            autoCaptured = true;
          }
        } else {
          const capErr = await capRes.json().catch(() => ({}));
          console.warn(`[razorpay-webhook] ⚠️ Auto-capture API call for ${razorpayPaymentId} returned ${capRes.status}:`, capErr);
        }
      } catch (capEx) {
        console.warn("[razorpay-webhook] Auto-capture API call exception:", capEx);
      }
    }

    if (autoCaptured) {
      // Upgraded to captured: update status to Paid and forward to Google Sheets
      const paidStatus = `Paid (Razorpay) · ${razorpayPaymentId}`;
      const targetId = existingOrder?.id || storefrontCandidateId;

      if (supabase && targetId) {
        try {
          await supabase
            .from("orders")
            .update({
              payment_status: paidStatus,
              razorpay_payment_id: razorpayPaymentId,
              razorpay_order_id: razorpayOrderId || existingOrder?.razorpay_order_id,
            })
            .eq("id", targetId);
        } catch (e) {
          console.warn("[razorpay-webhook] Paid update warning:", e);
        }
      }

      return sendApiResponse(res, 200, {
        received: true,
        event: eventType,
        processed: true,
        captured: true,
        status: paidStatus,
      });
    }

    // Capture not completed: update status to 'Payment Authorized (Pending Capture)' — NEVER mark Paid!
    const authStatus = `Payment Authorized (Pending Capture) · ${razorpayPaymentId}`;
    console.info(`[razorpay-webhook] ⚠️ Payment ${razorpayPaymentId} remains in ${authStatus}.`);

    if (supabase && (existingOrder?.id || storefrontCandidateId)) {
      const targetId = existingOrder?.id || storefrontCandidateId;
      if (!existingOrder?.payment_status?.startsWith("Paid")) {
        try {
          await supabase
            .from("orders")
            .update({
              payment_status: authStatus,
              razorpay_payment_id: razorpayPaymentId,
              razorpay_order_id: razorpayOrderId || existingOrder?.razorpay_order_id,
            })
            .eq("id", targetId);
        } catch (e) {
          console.warn("[razorpay-webhook] Authorized update warning:", e);
        }
      }
    }

    return sendApiResponse(res, 200, {
      received: true,
      event: eventType,
      processed: true,
      captured: false,
      status: authStatus,
    });
  }

  // ── Handle EVENT: payment.failed ──────────────────────────────────────────
  if (eventType === "payment.failed") {
    const reason =
      paymentEntity?.error_description ||
      paymentEntity?.error_reason ||
      paymentEntity?.error_code ||
      "Payment Failed";
    const failedStatus = `Payment Failed (Razorpay) · ${reason}`;
    console.warn(`[razorpay-webhook] ❌ payment.failed: ${failedStatus} | Payment: ${razorpayPaymentId}`);

    if (supabase && (existingOrder?.id || storefrontCandidateId)) {
      const targetId = existingOrder?.id || storefrontCandidateId;
      // Only mark failed if order is currently pending (never overwrite an already Paid order!)
      if (existingOrder?.payment_status === "Pending Payment") {
        try {
          await supabase
            .from("orders")
            .update({
              payment_status: failedStatus,
              razorpay_payment_id: razorpayPaymentId || null,
            })
            .eq("id", targetId);
        } catch (e) {
          console.warn("[razorpay-webhook] Failed update warning:", e);
        }
      }
    }

    return sendApiResponse(res, 200, {
      received: true,
      event: eventType,
      processed: true,
      status: failedStatus,
    });
  }

  // ── Handle EVENT: refund.created, refund.processed, payment.refunded ──────
  if (
    eventType === "refund.created" ||
    eventType === "refund.processed" ||
    eventType === "payment.refunded"
  ) {
    const refundId = refundEntity?.id || "";
    const isLateAuth =
      String(refundEntity?.notes?.reason || "").toLowerCase().includes("late") ||
      String(paymentEntity?.description || "").toLowerCase().includes("late");

    const refundStatus = isLateAuth
      ? "Refunded (Auto Refund: Late Authorization)"
      : `Refunded (Razorpay${refundId ? ` · ${refundId}` : ""})`;

    console.info(
      `[razorpay-webhook] 🔄 Refund event ${eventType}: ${refundStatus} | Payment: ${razorpayPaymentId}`
    );

    if (supabase && (existingOrder?.id || storefrontCandidateId)) {
      const targetId = existingOrder?.id || storefrontCandidateId;
      try {
        await supabase
          .from("orders")
          .update({
            payment_status: refundStatus,
            last_error: `Refund recorded via ${eventType}`,
          })
          .eq("id", targetId);
      } catch (e) {
        console.warn("[razorpay-webhook] Refund update warning:", e);
      }
    }

    return sendApiResponse(res, 200, {
      received: true,
      event: eventType,
      processed: true,
      status: refundStatus,
    });
  }

  // Acknowledge other unhandled events safely
  console.info(`[razorpay-webhook] ℹ️ Unhandled event acknowledged: ${eventType}`);
  return sendApiResponse(res, 200, { received: true, event: eventType, processed: false });
}
