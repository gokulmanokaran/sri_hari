// Vercel Serverless Function: /api/order-webhook
// Forwards order payloads to Google Apps Script or other backend services securely.

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
    return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const orderData = await req.json();

    if (!orderData || !orderData.orderId) {
      return new Response(JSON.stringify({ error: "Invalid order data: orderId is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const targetWebhookUrl =
      process.env.GOOGLE_SHEETS_WEBHOOK_URL ||
      process.env.VITE_ORDER_WEBHOOK_URL ||
      process.env.ORDER_WEBHOOK_URL;

    if (!targetWebhookUrl) {
      // If no webhook URL is configured yet, acknowledge order received
      console.info("[API /order-webhook] Order received (No downstream webhook URL configured yet):", orderData.orderId);
      return new Response(
        JSON.stringify({
          success: true,
          orderId: orderData.orderId,
          note: "Order recorded in API. Configure GOOGLE_SHEETS_WEBHOOK_URL in Vercel environment variables to forward directly.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Forward to Google Apps Script Webhook
    const upstreamRes = await fetch(targetWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(orderData),
    });

    const upstreamText = await upstreamRes.text();
    let upstreamJson: unknown;
    try {
      upstreamJson = JSON.parse(upstreamText);
    } catch {
      upstreamJson = { raw: upstreamText };
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderData.orderId,
        upstream: upstreamJson,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[API /order-webhook] Error processing order notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
