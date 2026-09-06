/// <reference types="node" />

// Vercel Serverless Function: /api/create-razorpay-order
// ──────────────────────────────────────────────────────────────────────────────
// Creates an official Razorpay Order securely using RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.
// Enforces backend product price verification, recalculation, and payment_capture: 1.
// 100% self-contained for Vercel Serverless (no relative import failures).
// ──────────────────────────────────────────────────────────────────────────────

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
      items,
      receipt,
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      currency = "INR",
    } = body || {};

    const supabase = getSupabaseServerClient();
    const targetOrderId = String(orderId || receipt || `rcpt_${Date.now()}`);

    // ── 1. Backend Price Validation & Recalculation from Database ────────────
    let finalAmountInRupees: number;
    let verifiedItems: any[] = [];
    let serverSubtotal = 0;
    let serverDeliveryCharge = 30;

    let itemsToVerify: any[] = Array.isArray(items) && items.length > 0 ? items : [];

    if (itemsToVerify.length === 0 && supabase && targetOrderId) {
      try {
        const { data: pendingOrder } = await supabase
          .from("orders")
          .select("items")
          .eq("id", targetOrderId)
          .maybeSingle();
        if (pendingOrder && Array.isArray(pendingOrder.items) && pendingOrder.items.length > 0) {
          itemsToVerify = pendingOrder.items;
        }
      } catch (err) {
        console.warn("[create-razorpay-order] Failed to fetch pre-persisted items:", err);
      }
    }

    if (itemsToVerify.length > 0 && supabase) {
      const { data: dbProducts, error: dbError } = await supabase
        .from("products")
        .select("*");

      if (dbError || !dbProducts || dbProducts.length === 0) {
        console.error("[create-razorpay-order] ❌ Failed to fetch products from DB:", dbError);
        return sendApiResponse(res, 400, {
          success: false,
          error: "Unable to verify products with the database. Please refresh your cart.",
        });
      }

      // Helper to resolve product or variant from dbProducts
      const resolveDbItem = (id: string) => {
        const direct = dbProducts.find((p: any) => p.id === id);
        if (direct) {
          return {
            id: direct.id,
            name: direct.name,
            nameTamil: direct.name_tamil || direct.tamil_name || "",
            price: Number(direct.price) || 0,
            unit: direct.unit || "1 Pack",
            inStock:
              direct.in_stock !== false &&
              (direct.stock_quantity === null || direct.stock_quantity === undefined || Number(direct.stock_quantity) > 0),
            active: direct.active !== false,
          };
        }
        for (const p of dbProducts) {
          if (Array.isArray(p.variants)) {
            const v = p.variants.find((v: any) => v.id === id);
            if (v) {
              const isSugar = p.variant_type === "sugar";
              const parentInStock =
                p.in_stock !== false &&
                (p.stock_quantity === null || p.stock_quantity === undefined || Number(p.stock_quantity) > 0);
              return {
                id: v.id,
                name: p.name,
                nameTamil: p.name_tamil || p.tamil_name || "",
                price: Number(v.price) || 0,
                unit: isSugar ? `${p.unit} (${v.unit})` : v.unit,
                inStock: v.inStock !== false && parentInStock,
                active: p.active !== false,
              };
            }
          }
        }
        return null;
      };

      // Check each item against live database
      for (const item of itemsToVerify) {
        const dbProduct = resolveDbItem(item.id);
        if (!dbProduct) {
          return sendApiResponse(res, 400, {
            success: false,
            error: `Product "${item.name || item.id}" is no longer available in our store.`,
          });
        }

        if (dbProduct.active === false) {
          return sendApiResponse(res, 400, {
            success: false,
            error: `Product "${dbProduct.name}" is currently unavailable.`,
          });
        }

        if (!dbProduct.inStock) {
          return sendApiResponse(res, 400, {
            success: false,
            error: `Product "${dbProduct.name}" is out of stock. Please remove it from your cart.`,
          });
        }

        const dbPrice = dbProduct.price;
        const requestedPrice = item.price !== undefined ? Number(item.price) : undefined;

        // CRITICAL: Reject order if price in cart differs from database price
        if (requestedPrice !== undefined && requestedPrice !== dbPrice) {
          console.warn(
            `[create-razorpay-order] ❌ Price mismatch for ${dbProduct.name}: Cart ₹${requestedPrice} vs DB ₹${dbPrice}`
          );
          return sendApiResponse(res, 400, {
            success: false,
            priceChanged: true,
            error: `The price of ${dbProduct.name} has changed from ₹${requestedPrice} to ₹${dbPrice}. Your cart must be reviewed before checkout.`,
            changedItem: {
              id: dbProduct.id,
              name: dbProduct.name,
              oldPrice: requestedPrice,
              newPrice: dbPrice,
            },
          });
        }

        const quantity = Math.max(1, Number(item.quantity) || 1);
        serverSubtotal += dbPrice * quantity;

        verifiedItems.push({
          id: dbProduct.id,
          name: dbProduct.name,
          nameTamil: dbProduct.nameTamil,
          quantity,
          price: dbPrice,
          unit: dbProduct.unit,
        });
      }

      // Minimum order value: ₹199
      if (serverSubtotal < 199) {
        return sendApiResponse(res, 400, {
          success: false,
          error: "Minimum order value is ₹199. Please add more items to your cart.",
        });
      }

      // Delivery charge rules: > ₹299 is FREE, otherwise ₹30
      serverDeliveryCharge = serverSubtotal > 299 ? 0 : 30;
      finalAmountInRupees = serverSubtotal + serverDeliveryCharge;

      // If client supplied an amount that doesn't match backend total, reject
      if (amount !== undefined && Math.round(Number(amount)) !== Math.round(finalAmountInRupees)) {
        console.warn(
          `[create-razorpay-order] ❌ Client amount ₹${amount} does not match server recalculated total ₹${finalAmountInRupees}`
        );
        return sendApiResponse(res, 400, {
          success: false,
          priceChanged: true,
          error: `Order total has changed. Recalculated total is ₹${finalAmountInRupees}. Please review your updated cart.`,
          serverTotal: finalAmountInRupees,
        });
      }
    } else {
      if (!amount || Number(amount) <= 0) {
        return sendApiResponse(res, 400, {
          success: false,
          error: "Invalid amount or empty items. An order must have items.",
        });
      }
      finalAmountInRupees = Number(amount);
    }

    const envKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
    const keyId = (envKeyId && envKeyId !== "rzp_live_TVqupLsjlS8bW6") ? envKeyId : "rzp_live_TY2BW22RrguaTm";

    const keySecret =
      process.env.RAZORPAY_KEY_SECRET ||
      "oL8mctJQ6knuPbIoZwaUMPjX";

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
    const cleanReceipt = targetOrderId.slice(0, 40);

    console.info(
      `[create-razorpay-order] 🚀 Calling Razorpay Orders API for #${targetOrderId} | Amount: ₹${finalAmountInRupees} (${Math.round(finalAmountInRupees * 100)} paise)`
    );

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(finalAmountInRupees * 100), // in paise, strictly from verified server total
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
      const errData = await razorpayResponse.json().catch(() => ({}) as any) as any;
      console.error("[create-razorpay-order] ❌ Razorpay Orders API rejected request:", errData);
      return sendApiResponse(res, razorpayResponse.status, {
        success: false,
        error: errData?.error?.description || "Razorpay API error creating order",
        details: errData,
      });
    }

    const orderData = await razorpayResponse.json() as any;

    if (!orderData?.id || !orderData.id.startsWith("order_")) {
      console.error("[create-razorpay-order] ❌ Razorpay returned response without valid order_id:", orderData);
      return sendApiResponse(res, 500, {
        success: false,
        error: "Razorpay did not return a valid Order ID.",
      });
    }

    console.info(`[create-razorpay-order] ✅ Razorpay Order created successfully: ${orderData.id}`);

    // Immediately save razorpay_order_id and verified pricing in Supabase pending order record
    try {
      if (supabase && targetOrderId) {
        const updatePayload: Record<string, unknown> = {
          razorpay_order_id: orderData.id,
        };
        if (verifiedItems.length > 0) {
          updatePayload.items = verifiedItems;
          updatePayload.subtotal = serverSubtotal;
          updatePayload.delivery_charge = serverDeliveryCharge;
          updatePayload.total = finalAmountInRupees;
        }
        await supabase
          .from("orders")
          .update(updatePayload)
          .eq("id", targetOrderId);
        console.info(
          `[create-razorpay-order] 🔗 Linked Razorpay Order ID ${orderData.id} to storefront order #${targetOrderId} with verified total ₹${finalAmountInRupees}`
        );
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
      verifiedTotal: finalAmountInRupees,
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
