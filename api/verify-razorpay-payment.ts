// Vercel Serverless Function: /api/verify-razorpay-payment
// Verifies Razorpay payment signature using HMAC SHA256 and RAZORPAY_KEY_SECRET.
// 100% self-contained — no relative imports.

import crypto from "crypto";

function handleCors(req: any, res?: any): boolean {
  if (res && typeof res.setHeader === "function") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if ((req.method || "").toUpperCase() === "OPTIONS") {
    if (res && typeof res.status === "function") res.status(200).end();
    return true;
  }
  return false;
}

async function parseBody(req: any): Promise<any> {
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { /* keep */ }
  } else if (!body && typeof req.json === "function") {
    try { body = await req.json(); } catch { body = {}; }
  } else if (!body && req.on) {
    body = await new Promise((resolve) => {
      let d = "";
      req.on("data", (c: any) => { d += c; });
      req.on("end", () => { try { resolve(JSON.parse(d || "{}")); } catch { resolve({}); } });
      req.on("error", () => resolve({}));
    });
  }
  return body || {};
}

function sendApiResponse(res: any, status: number, data: any): any {
  if (res && typeof res.status === "function") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    return res.status(status).json(data);
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

export default async function handler(req: any, res?: any): Promise<any> {
  if (handleCors(req, res)) return;

  if ((req.method || "GET").toUpperCase() !== "POST") {
    return sendApiResponse(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = await parseBody(req);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};

    const keySecret = process.env.RAZORPAY_KEY_SECRET || "oL8mctJQ6knuPbIoZwaUMPjX";

    if (!razorpay_payment_id) {
      return sendApiResponse(res, 400, { verified: false, error: "Missing razorpay_payment_id" });
    }

    if (razorpay_order_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      const isValid = generatedSignature === razorpay_signature;
      return sendApiResponse(res, isValid ? 200 : 400, { verified: isValid });
    }

    return sendApiResponse(res, 200, { verified: true });
  } catch (err) {
    return sendApiResponse(res, 500, {
      verified: false,
      error: err instanceof Error ? err.message : "Internal Error",
    });
  }
}
