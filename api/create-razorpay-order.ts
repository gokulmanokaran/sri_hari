// Vercel Serverless Function: /api/create-razorpay-order
// Creates a Razorpay Order securely using RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { amount, receipt, currency = "INR" } = await req.json();

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TU0lWbkyOmj5C5";
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      // If secret not configured in server env, return status so client can proceed in test mode directly
      return new Response(
        JSON.stringify({
          configured: false,
          message: "RAZORPAY_KEY_SECRET not set in server environment. Client test checkout will be used.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // paise
        currency,
        receipt: String(receipt || `rcpt_${Date.now()}`),
        payment_capture: 1,
      }),
    });

    if (!razorpayResponse.ok) {
      const errData = await razorpayResponse.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: "Razorpay API error", details: errData }), {
        status: razorpayResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const orderData = await razorpayResponse.json();

    return new Response(
      JSON.stringify({
        configured: true,
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
