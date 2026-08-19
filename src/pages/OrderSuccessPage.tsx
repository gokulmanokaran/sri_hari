import { motion } from "framer-motion";
import { CheckCircle2, ShoppingBag, ArrowRight, Truck, Calendar, MapPin, MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { BUSINESS_PHONE } from "../data/deliveryZones";
import { useEffect } from "react";

interface SuccessState {
  orderId?: string;
  total?: number;
  subtotal?: number;
  deliveryCharge?: number;
  pincode?: string;
  name?: string;
}

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as SuccessState) || {};

  const orderId = state.orderId || `SHK${Math.floor(100000 + Math.random() * 900000)}`;
  const total = state.total ?? 230;
  const deliveryCharge = state.deliveryCharge ?? 30;
  const pincode = state.pincode ?? "641014";
  const name = state.name ?? "Valued Customer";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#F5FCF8] via-[#FAF8F1] to-white pb-16">
      {/* Subtle decorative celebration background elements */}
      <div className="relative overflow-hidden pt-12 pb-6 px-4">
        {/* Confetti particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 0,
              y: -20,
              x: (i % 2 === 0 ? 1 : -1) * (i * 25 + 10),
              scale: 0.5,
              rotate: 0,
            }}
            animate={{
              opacity: [0, 1, 0.8, 0],
              y: [0, 120 + (i % 4) * 30],
              rotate: [0, (i % 2 === 0 ? 180 : -180)],
              scale: [0.5, 1, 0.8],
            }}
            transition={{
              duration: 2.5,
              delay: i * 0.12,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeOut",
            }}
            className="absolute top-8 left-1/2 w-2.5 h-2.5 rounded-sm pointer-events-none"
            style={{
              backgroundColor:
                i % 4 === 0
                  ? "#00A651"
                  : i % 4 === 1
                  ? "#0BAF5B"
                  : i % 4 === 2
                  ? "#D4A017"
                  : "#3B82F6",
            }}
          />
        ))}

        <div className="max-w-md mx-auto flex flex-col items-center text-center">
          {/* Animated Green Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: 0.1,
            }}
            className="w-20 h-20 rounded-full bg-[#EAF8F0] border-4 border-white shadow-xl flex items-center justify-center mb-5"
            style={{ boxShadow: "0 10px 30px rgba(0, 166, 81, 0.25)" }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 400 }}
            >
              <CheckCircle2 size={44} className="text-[#00A651]" strokeWidth={2.5} />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="inline-block bg-[#EAF8F0] text-[#00A651] text-xs font-extrabold px-3 py-1 rounded-full mb-2 tracking-wide">
              ORDER CONFIRMED
            </span>
            <h1 className="text-2xl font-black text-[#111111] tracking-tight">
              Order Placed Successfully! 🎉
            </h1>
            <p className="text-sm text-[#666666] mt-1">
              Thank you, <span className="font-semibold text-[#111111]">{name}</span>. Your natural goodies are being prepped.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Order Details Card */}
      <div className="max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, type: "spring", stiffness: 280, damping: 26 }}
          className="bg-white rounded-[22px] p-5 border border-[#EAEAEA] shadow-sm mb-4"
        >
          {/* Header info */}
          <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
            <div>
              <p className="text-xs font-semibold text-[#999999]">Order Reference</p>
              <p className="text-sm font-black text-[#111111] tracking-wider">{orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-[#999999]">Total Amount</p>
              <p className="text-base font-black text-[#00A651]">₹{total}</p>
            </div>
          </div>

          {/* Delivery Highlights */}
          <div className="py-4 space-y-3.5 border-b border-[#EAEAEA]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#EAF8F0] flex items-center justify-center flex-shrink-0 text-[#00A651]">
                <Truck size={16} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#111111]">Expected Delivery</p>
                <p className="text-xs text-[#666666]">Tomorrow Evening (Guaranteed)</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FAF8F1] flex items-center justify-center flex-shrink-0 text-[#D4A017]">
                <MapPin size={16} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#111111]">Delivery Destination</p>
                <p className="text-xs text-[#666666]">Pincode {pincode} · Delivery Fee: ₹{deliveryCharge}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F5FCF8] flex items-center justify-center flex-shrink-0 text-[#087A43]">
                <Calendar size={16} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-[#111111]">Order Time</p>
                <p className="text-xs text-[#666666]">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Quality Promise */}
          <div className="pt-4 flex items-center gap-2 bg-[#F5FCF8] rounded-[14px] p-3 text-xs text-[#087A43] font-medium">
            <span className="text-sm">🌿</span>
            <span>Cleaned fresh leafy greens & premium whole foods guaranteed.</span>
          </div>
        </motion.div>

        {/* Quick Help / Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-white rounded-[20px] p-4 border border-[#EAEAEA] flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#25D366]/15 flex items-center justify-center text-[#25D366]">
              <MessageCircle size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#111111]">Need instant support?</p>
              <p className="text-[11px] text-[#666666]">WhatsApp us with order ID {orderId}</p>
            </div>
          </div>
          <a
            href={`https://wa.me/91${BUSINESS_PHONE}?text=Hi%20Shree%20Hari%20Keerai%2C%20regarding%20my%20order%20${orderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#25D366] bg-[#25D366]/10 px-3 py-1.5 rounded-full hover:bg-[#25D366]/20 transition-colors"
          >
            Chat
          </a>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex flex-col gap-3"
        >
          <Button
            variant="primary"
            size="xl"
            fullWidth
            onClick={() => navigate("/products")}
            icon={<ShoppingBag size={18} />}
          >
            Continue Shopping
          </Button>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => navigate("/account")}
            icon={<ArrowRight size={16} />}
            iconPosition="right"
          >
            View Order History
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
