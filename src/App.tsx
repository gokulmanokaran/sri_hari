import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useDelivery } from "./store/DeliveryContext";

import PincodePage from "./pages/PincodePage";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";

import SearchPage from "./pages/SearchPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import RefundPolicyPage from "./pages/RefundPolicyPage";

import { TopSnackbar } from "./components/ui/TopSnackbar";
import { FloatingCartButton } from "./components/features/FloatingCartButton";
import { DailyNotification } from "./components/features/DailyNotification";
import { PermissionPromptModal } from "./components/features/PermissionPromptModal";
import { retryPendingOrderNotifications } from "./services/orderService";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Flush any queued pending order notifications in background
  useEffect(() => {
    retryPendingOrderNotifications();
  }, []);

  return null;
}

// App wrapper with daily notification support
function PincodeGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Schedule daily 9AM notification for users in the app */}
      <DailyNotification />
      {children}
    </>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-white text-[#111111] antialiased selection:bg-[#EAF8F0] selection:text-[#00A651]">
      <ScrollToTop />
      
      {/* Global Top Modern Snackbar for cart updates */}
      <TopSnackbar />

      {/* Global Floating Cart Button at bottom-right */}
      <FloatingCartButton />

      {/* User-friendly Centered Permission Prompt Modal for Notifications & Location */}
      <PermissionPromptModal />

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeInOut" }}
          className="w-full min-h-dvh"
        >
          <Routes location={location}>
            {/* Redirect legacy /pincode to Home */}
            <Route path="/pincode" element={<Navigate to="/" replace />} />

            {/* Protected Store Routes */}
            <Route
              path="/"
              element={
                <PincodeGuard>
                  <HomePage />
                </PincodeGuard>
              }
            />
            <Route
              path="/products"
              element={
                <PincodeGuard>
                  <ProductsPage />
                </PincodeGuard>
              }
            />
            <Route
              path="/products/:id"
              element={
                <PincodeGuard>
                  <ProductDetailsPage />
                </PincodeGuard>
              }
            />
            <Route
              path="/cart"
              element={
                <PincodeGuard>
                  <CartPage />
                </PincodeGuard>
              }
            />
            <Route
              path="/checkout"
              element={
                <PincodeGuard>
                  <CheckoutPage />
                </PincodeGuard>
              }
            />
            <Route
              path="/order-success"
              element={
                <PincodeGuard>
                  <OrderSuccessPage />
                </PincodeGuard>
              }
            />

            <Route
              path="/search"
              element={
                <PincodeGuard>
                  <SearchPage />
                </PincodeGuard>
              }
            />

            {/* Legal & Compliance Policy Routes */}
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/terms-and-conditions" element={<TermsPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/cancellation-refund-policy" element={<RefundPolicyPage />} />

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
