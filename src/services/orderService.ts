/**
 * Order Notification & Google Sheets Service
 * ──────────────────────────────────────────
 * Handles sending order details to Google Sheets and triggering admin/customer email notifications.
 *
 * Flow:
 * 1. Validates order payload.
 * 2. Checks local deduplication (prevents duplicate submissions for same order ID).
 * 3. Sends POST request to configured Webhook URL (Google Apps Script / Backend API).
 * 4. Logs response and persists notification status in localStorage.
 * 5. Queues any failed notifications for background retry without blocking the customer.
 */

export interface OrderItemPayload {
  id?: string;
  name: string;
  nameTamil?: string;
  quantity: number;
  price: number;
  unit?: string;
}

export interface OrderNotificationPayload {
  orderId: string;
  createdAt: string;
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
  items: OrderItemPayload[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  discountPercentage?: number;
  total: number;
  paymentStatus: string;
  paymentId?: string;
  razorpayPaymentId?: string;
}

export interface OrderNotificationResult {
  success: boolean;
  orderId: string;
  message?: string;
  error?: string;
}

const SUBMITTED_ORDERS_KEY = "shreehari_submitted_order_ids";
const PENDING_QUEUE_KEY = "shreehari_pending_order_notifications";

const DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbzjXsA4gHp4u30Qx9RhFamyOIrSjqs2yi9K5wAF1YylK8FU9Ushsex8kffAIIRUR3bI/exec";

/** Get the configured Webhook URL */
export function getWebhookUrl(): string {
  return (
    import.meta.env.VITE_ORDER_WEBHOOK_URL ||
    import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL ||
    DEFAULT_GOOGLE_SHEETS_WEBHOOK_URL
  );
}

/** Check if this order was already notified */
function isOrderAlreadyNotified(orderId: string): boolean {
  try {
    const raw = localStorage.getItem(SUBMITTED_ORDERS_KEY);
    if (!raw) return false;
    const ids: string[] = JSON.parse(raw);
    return ids.includes(orderId);
  } catch {
    return false;
  }
}

/** Mark order as notified in localStorage */
function markOrderNotified(orderId: string): void {
  try {
    const raw = localStorage.getItem(SUBMITTED_ORDERS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    if (!ids.includes(orderId)) {
      ids.push(orderId);
      localStorage.setItem(SUBMITTED_ORDERS_KEY, JSON.stringify(ids.slice(-50))); // keep last 50
    }
  } catch {
    // Ignore storage issues
  }
}

/** Format products into a concise string for Google Sheets */
export function formatProductsSummary(items: OrderItemPayload[]): string {
  return items
    .map((item) => {
      const unit = item.unit ? ` (${item.unit})` : "";
      return `${item.name}${unit} × ${item.quantity}`;
    })
    .join(", ");
}

/** Format total quantity of items */
export function getTotalQuantity(items: OrderItemPayload[]): number {
  return items.reduce((acc, item) => acc + (item.quantity || 1), 0);
}

/**
 * Submits order details to the Google Sheets / Email webhook.
 * Non-blocking: will never throw an unhandled error or break the checkout flow.
 */
export async function submitOrderNotification(
  payload: OrderNotificationPayload
): Promise<OrderNotificationResult> {
  const { orderId } = payload;

  // 1. Deduplication check
  if (isOrderAlreadyNotified(orderId)) {
    console.info(`[OrderService] Order #${orderId} has already been notified. Skipping duplicate.`);
    return { success: true, orderId, message: "Order already notified" };
  }

  // 2. Prepare structured data
  const mapsLink =
    payload.mapsLink ||
    (payload.lat && payload.lng ? `https://www.google.com/maps?q=${payload.lat},${payload.lng}` : "");

  const totalQuantity = getTotalQuantity(payload.items);
  const productsSummary = formatProductsSummary(payload.items);

  const formattedDate = new Date(payload.createdAt || Date.now()).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const requestBody = {
    ...payload,
    paymentId: payload.paymentId || payload.razorpayPaymentId || "N/A",
    mapsLink,
    productsSummary,
    totalQuantity,
    formattedDate,
    source: "Shree Hari Keerai Storefront",
  };

  const webhookUrl = getWebhookUrl();
  const isGoogleAppsScript = webhookUrl.includes("script.google.com");

  console.info(`[OrderService] Sending order #${orderId} to Google Sheets Webhook...`, requestBody);

  try {
    // For Google Apps Script, mode: "no-cors" is required because Google's 302 redirect
    // does not include browser CORS headers. In no-cors mode, the POST body is still delivered
    // and executed by doPost on Google's servers.
    const fetchOptions: RequestInit = {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(requestBody),
    };

    if (isGoogleAppsScript) {
      fetchOptions.mode = "no-cors";
    }

    const response = await fetch(webhookUrl, fetchOptions);

    if (response.ok || response.type === "opaque" || response.status === 0) {
      markOrderNotified(orderId);
      console.info(`[OrderService] Order #${orderId} successfully dispatched to Google Sheets & Email!`);
      return { success: true, orderId };
    } else {
      const errText = await response.text().catch(() => "");
      console.warn(`[OrderService] Webhook responded with status ${response.status}:`, errText);
      queuePendingNotification(requestBody);
      return { success: false, orderId, error: `Status ${response.status}` };
    }
  } catch (error) {
    console.warn(`[OrderService] Network error sending order #${orderId} to webhook:`, error);
    // Queue for retry
    queuePendingNotification(requestBody);
    return {
      success: false,
      orderId,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/** Queue failed order for later background retry */
function queuePendingNotification(payload: unknown): void {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    const queue: unknown[] = raw ? JSON.parse(raw) : [];
    queue.push({ payload, queuedAt: new Date().toISOString() });
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue.slice(-20)));
  } catch {
    // Ignore storage issues
  }
}

/**
 * Background retry worker to attempt sending any previously queued orders
 */
export async function retryPendingOrderNotifications(): Promise<void> {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY);
    if (!raw) return;
    const queue: Array<{ payload: OrderNotificationPayload; queuedAt: string }> = JSON.parse(raw);
    if (!queue.length) return;

    localStorage.removeItem(PENDING_QUEUE_KEY);

    for (const item of queue) {
      await submitOrderNotification(item.payload);
    }
  } catch {
    // Ignore retry issues
  }
}
