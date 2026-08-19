import { motion } from "framer-motion";
import { MapPin, Phone, MessageCircle, Clock, ShieldCheck, ShoppingBag, ChevronRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDelivery } from "../store/DeliveryContext";
import { useCart } from "../store/CartContext";
import { Header } from "../components/layout/Header";
import { Button } from "../components/ui/Button";
import { BUSINESS_PHONE } from "../data/deliveryZones";
import logoImg from "../assets/logo.png";

export default function AccountPage() {
  const navigate = useNavigate();
  const { pincode, deliveryCharge, clearPincode } = useDelivery();
  const { itemCount } = useCart();

  const handleResetLocation = () => {
    clearPincode();
    navigate("/pincode");
  };

  return (
    <>
      <Header />

      <main className="min-h-dvh bg-[#FAFAFA] pb-24">
        <div className="max-w-md mx-auto px-4 pt-4 flex flex-col gap-4">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[22px] p-5 border border-[#EAEAEA] shadow-sm flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-[16px] bg-[#F5FCF8] border border-[#00A651]/20 p-2 flex items-center justify-center shadow-sm flex-shrink-0">
              <img
                src={logoImg}
                alt="Shree Hari Keerai"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-bold text-[#00A651] bg-[#EAF8F0] px-2.5 py-0.5 rounded-full">
                Verified Customer
              </span>
              <h1 className="text-base font-black text-[#111111] mt-1 truncate">Shree Hari Customer</h1>
              <p className="text-xs text-[#888888]">{pincode ? `Serving Pincode ${pincode}` : "Coimbatore, Tamil Nadu"}</p>
            </div>
          </motion.div>

          {/* Delivery Location Section */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[20px] p-4 border border-[#EAEAEA] shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#00A651]" />
                <h2 className="text-sm font-bold text-[#111111]">Delivery Location</h2>
              </div>
              {deliveryCharge !== null && (
                <span className="text-xs font-bold text-[#00A651] bg-[#EAF8F0] px-2 py-0.5 rounded-full">
                  ₹{deliveryCharge} charge
                </span>
              )}
            </div>

            <div className="bg-[#F5FCF8] rounded-[14px] p-3.5 flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-[#666666]">Active Area Pincode</p>
                <p className="text-base font-black text-[#111111]">{pincode || "Not configured"}</p>
              </div>
              <button
                onClick={handleResetLocation}
                className="flex items-center gap-1.5 text-xs font-bold text-[#00A651] bg-white border border-[#00A651]/20 px-3 py-1.5 rounded-full hover:bg-[#EAF8F0] transition-colors cursor-pointer"
              >
                <RefreshCw size={12} />
                Change
              </button>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[20px] border border-[#EAEAEA] shadow-sm overflow-hidden divide-y divide-[#F5F5F5]"
          >
            <button
              onClick={() => navigate("/cart")}
              className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EAF8F0] text-[#00A651] flex items-center justify-center">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111111]">Current Cart</p>
                  <p className="text-xs text-[#888888]">{itemCount} items ready for order</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#CCCCCC]" />
            </button>

            <button
              onClick={() => navigate("/products")}
              className="w-full flex items-center justify-between p-4 hover:bg-[#F9F9F9] transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FFF8E7] text-[#D4A017] flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111111]">Delivery Schedule</p>
                  <p className="text-xs text-[#888888]">Order before 11:00 AM for evening drop</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#CCCCCC]" />
            </button>

            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#F5FCF8] text-[#087A43] flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111111]">100% Quality Assurance</p>
                <p className="text-xs text-[#888888]">Freshly washed greens & premium unadulterated products</p>
              </div>
            </div>
          </motion.div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-[20px] p-4 border border-[#EAEAEA] shadow-sm"
          >
            <h2 className="text-sm font-bold text-[#111111] mb-3">Customer Support</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`tel:${BUSINESS_PHONE}`}
                className="flex items-center justify-center gap-2 h-11 rounded-[12px] bg-[#F5F5F5] hover:bg-gray-200 text-xs font-bold text-[#111111] transition-colors"
              >
                <Phone size={14} className="text-[#00A651]" />
                Call Helpline
              </a>
              <a
                href={`https://wa.me/91${BUSINESS_PHONE}?text=Hi%20Shree%20Hari%20Keerai`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 h-11 rounded-[12px] bg-[#25D366]/10 hover:bg-[#25D366]/20 text-xs font-bold text-[#25D366] transition-colors"
              >
                <MessageCircle size={14} />
                WhatsApp Chat
              </a>
            </div>
          </motion.div>

          {/* Switch Location Full Button */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={handleResetLocation}
            >
              Reset Delivery Pincode Gate
            </Button>
          </motion.div>
        </div>
      </main>
    </>
  );
}
