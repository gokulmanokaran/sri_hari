import { useEffect, useRef } from "react";
import { STORAGE_KEYS, getItem, setItem } from "../../utils/storage";

/**
 * DailyNotification
 *
 * - Requests notification permission from the user (once, stored in localStorage).
 * - If permission is granted, schedules a notification for 9:00 AM today (or tomorrow
 *   if it's already past 9 AM) — provided we haven't already sent one today.
 * - Tracks the last-sent date in localStorage to avoid duplicate notifications.
 * - Mounted once globally in App.tsx (only for users who have passed the pincode gate).
 *
 * Note: This is a client-side scheduled notification using the Web Notification API
 * and a setTimeout. The notification fires as long as the browser tab/service-worker
 * is alive. True server-push would require a backend + FCM.
 */
export function DailyNotification() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Check for Notification API support
    if (!("Notification" in window)) return;

    async function setup() {
      // Request permission if not yet decided
      if (Notification.permission === "default") {
        const alreadyAsked = getItem<boolean>(
          STORAGE_KEYS.NOTIFICATION_PERMISSION_ASKED,
          false
        );
        if (!alreadyAsked) {
          setItem(STORAGE_KEYS.NOTIFICATION_PERMISSION_ASKED, true);
          await Notification.requestPermission();
        }
      }

      if (Notification.permission !== "granted") return;

      // Check if we already sent a notification today
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
      const lastSent = getItem<string>(STORAGE_KEYS.NOTIFICATION_LAST_SENT, "");
      if (lastSent === today) return;

      // Calculate ms until 9:00 AM
      const now = new Date();
      const next9am = new Date(now);
      next9am.setHours(9, 0, 0, 0);

      if (now >= next9am) {
        // Already past 9 AM today — schedule for tomorrow 9 AM
        next9am.setDate(next9am.getDate() + 1);
      }

      const msUntil9am = next9am.getTime() - now.getTime();

      timerRef.current = setTimeout(() => {
        const sentToday = new Date().toISOString().slice(0, 10);
        const alreadySentToday = getItem<string>(
          STORAGE_KEYS.NOTIFICATION_LAST_SENT,
          ""
        );
        if (alreadySentToday === sentToday) return;

        // Fire the notification
        const notif = new Notification("🌿 Shree Hari Keerai — Pre-Order Now!", {
          body: "Fresh greens & natural foods are ready to order! Place your order today for tomorrow delivery.",
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "daily-promo", // prevents duplicate notifications with the same tag
        });

        // Mark as sent for today
        setItem(STORAGE_KEYS.NOTIFICATION_LAST_SENT, sentToday);

        // Auto-close after 8 seconds
        setTimeout(() => notif.close(), 8000);
      }, msUntil9am);
    }

    setup();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // This component renders nothing — it's a side-effect only component
  return null;
}
