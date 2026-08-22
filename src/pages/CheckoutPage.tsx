import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Truck, MapPin, Tag, Edit3, Navigation } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../store/CartContext";
import { useDelivery } from "../store/DeliveryContext";
import { Button } from "../components/ui/Button";
import { MapLocationPicker, type MapLocationResult } from "../components/features/MapLocationPicker";
import {
  validateCheckoutForm,
  type CheckoutFormData,
  type CheckoutErrors,
} from "../utils/validation";
import { DEFAULT_MINIMUM_ORDER } from "../data/deliveryZones";

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, type: "spring" as const, stiffness: 280, damping: 28 },
  }),
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, discount, discountedSubtotal, clearCart } = useCart();
  const { pincode, deliveryCharge, minimumOrder } = useDelivery();

  const charge = deliveryCharge ?? 0;
  const minOrder = minimumOrder ?? DEFAULT_MINIMUM_ORDER;
  const total = discountedSubtotal + charge;

  const [form, setForm] = useState<CheckoutFormData & { address: string }>({
    pincode: pincode,
    lat: null,
    lng: null,
    address: "",
  });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [placing, setPlacing] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const isNavigatingToSuccessRef = useRef(false);

  // Auto redirect to cart if empty on initial mount
  useEffect(() => {
    if (!isNavigatingToSuccessRef.current && !placing && items.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [items.length, placing, navigate]);

  const handleMapConfirm = useCallback((result: MapLocationResult) => {
    setForm((prev) => ({
      ...prev,
      lat: result.lat,
      lng: result.lng,
      address: result.address ?? "",
    }));
    setErrors((prev) => ({ ...prev, location: undefined }));
    setShowMap(false);
  }, []);

  const handlePlaceOrder = async () => {
    if (subtotal < minOrder) {
      navigate("/cart");
      return;
    }

    const newErrors = validateCheckoutForm(form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Auto open map if pin not selected
      setShowMap(true);
      return;
    }

    isNavigatingToSuccessRef.current = true;
    setPlacing(true);

    const orderId = `SHK${Date.now().toString().slice(-6)}`;
    const orderItems = items.map((i) => ({
      id: i.product.id,
      name: i.product.name,
      nameTamil: i.product.nameTamil,
      quantity: i.quantity,
      price: i.product.price,
      unit: i.product.unit,
    }));

    const orderRecord = {
      orderId,
      total,
      subtotal,
      discount: discount.amount,
      discountPercentage: discount.percentage,
      deliveryCharge: charge,
      pincode: form.pincode,
      lat: form.lat,
      lng: form.lng,
      address: form.address,
      items: orderItems,
      createdAt: new Date().toISOString(),
    };

    // Save order in localStorage so it persists on page refresh
    try {
      localStorage.setItem("shreehari_latest_order", JSON.stringify(orderRecord));
      const existingOrdersRaw = localStorage.getItem("shreehari_orders");
      const existingOrders = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];
      localStorage.setItem("shreehari_orders", JSON.stringify([orderRecord, ...existingOrders]));
    } catch {
      // Ignore storage errors
    }

    // Brief simulation for smooth UX
    await new Promise((r) => setTimeout(r, 600));

    // Clear cart and immediately transition to Order Success
    clearCart();
    navigate("/order-success", {
      replace: true,
      state: orderRecord,
    });
  };

  if (items.length === 0 && !placing) {
    return null;
  }

  return (
    <>
      {/* Google Maps Full-Screen Pin Picker */}
      {showMap && (
        <MapLocationPicker
          initialLat={form.lat}
          initialLng={form.lng}
          onConfirm={handleMapConfirm}
          onClose={() => setShowMap(false)}
        />
      )}

      <div className="min-h-dvh bg-[#FAFAFA]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#EAEAEA] bg-white sticky top-0 z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-black text-[#111111]">Checkout</h1>
        </div>

        <div className="max-w-lg mx-auto px-4 py-5 pb-20 flex flex-col gap-4">

          {/* Section 1: Delivery Location (Google Maps Pin Only) */}
          <motion.div
            custom={0}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-[20px] border border-[#EAEAEA] overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EAEAEA] bg-[#F9F9F9]">
              <div className="w-6 h-6 rounded-full bg-[#EA4335] text-white text-xs font-black flex items-center justify-center">
                1
              </div>
              <h2 className="text-sm font-bold text-[#111111]">Delivery Location</h2>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {/* Interactive Google Map Pin Selection Card */}
              <button
                onClick={() => setShowMap(true)}
                className={`w-full flex items-center gap-3.5 p-4 rounded-[16px] border-2 transition-all cursor-pointer text-left ${
                  form.lat !== null
                    ? "border-[#00A651] bg-[#EAF8F0]/70"
                    : errors.location
                    ? "border-[#EA4335] bg-red-50"
                    : "border-dashed border-[#CCCCCC] hover:border-[#00A651] hover:bg-[#F5FCF8]"
                }`}
                aria-label="Select delivery location on Google Maps"
              >
                <div
                  className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-sm ${
                    form.lat !== null
                      ? "bg-[#00A651] text-white"
                      : "bg-[#EA4335] text-white"
                  }`}
                >
                  <MapPin size={22} className="fill-current" />
                </div>

                <div className="flex-1 min-w-0">
                  {form.lat !== null ? (
                    <>
                      <p className="text-sm font-black text-[#087A43]">
                        Location selected ✓
                      </p>
                      {form.address ? (
                        <p className="text-xs text-[#555555] mt-0.5 truncate">{form.address}</p>
                      ) : (
                        <p className="text-xs text-[#666666] mt-0.5">Tap to change location</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-black text-[#111111]">
                        Select Delivery Location
                      </p>
                      <p className="text-xs text-[#666666] mt-0.5">
                        Tap to open map and place your delivery pin
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 ${
                    form.lat !== null
                      ? "bg-white text-[#00A651] border border-[#00A651]/20 shadow-sm"
                      : "bg-[#EA4335] text-white"
                  }`}>
                    {form.lat !== null ? (
                      <>
                        <Edit3 size={12} />
                        Change
                      </>
                    ) : (
                      <>
                        <Navigation size={12} />
                        Open Map
                      </>
                    )}
                  </span>
                </div>
              </button>

              {errors.location && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[#EA4335] text-xs font-bold px-1"
                >
                  ⚠️ {errors.location}
                </motion.p>
              )}
            </div>
          </motion.div>

          {/* Section 2: Delivery Method */}
          <motion.div
            custom={1}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-[20px] border border-[#EAEAEA] overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EAEAEA] bg-[#F9F9F9]">
              <div className="w-6 h-6 rounded-full bg-[#00A651] text-white text-xs font-black flex items-center justify-center">
                2
              </div>
              <h2 className="text-sm font-bold text-[#111111]">Delivery</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4 bg-[#EAF8F0] rounded-[16px] p-4 border-2 border-[#00A651]">
                <div className="w-11 h-11 bg-[#00A651] rounded-[12px] flex items-center justify-center flex-shrink-0">
                  <Truck size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#111111]">
                    Today Order → Tomorrow Delivery
                  </p>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Order placed today will be delivered tomorrow
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-black text-[#00A651]">₹{charge}</p>
                  <p className="text-xs text-[#999999]">charge</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section 3: Order Summary */}
          <motion.div
            custom={2}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-[20px] border border-[#EAEAEA] overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EAEAEA] bg-[#F9F9F9]">
              <div className="w-6 h-6 rounded-full bg-[#00A651] text-white text-xs font-black flex items-center justify-center">
                3
              </div>
              <h2 className="text-sm font-bold text-[#111111]">Order Summary</h2>
            </div>
            <div className="p-4">
              {/* Items list */}
              <div className="flex flex-col gap-2 mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <div className="flex-1 min-w-0 mr-3">
                      <span className="text-[#666666] truncate block">
                        {item.product.name}
                        {item.product.nameTamil && (
                          <span className="text-[#00A651]"> / {item.product.nameTamil}</span>
                        )}
                        {" "}× {item.quantity}
                      </span>
                    </div>
                    <span className="font-semibold text-[#111111] flex-shrink-0">
                      ₹{item.product.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-[#EAEAEA] pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Subtotal</span>
                  <span className="font-semibold text-[#111111]">₹{subtotal}</span>
                </div>
                {discount.amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#00A651] flex items-center gap-1">
                      <Tag size={12} />
                      Discount ({discount.percentage}%)
                    </span>
                    <span className="font-semibold text-[#00A651]">−₹{discount.amount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#666666]">Delivery Charge</span>
                  <span className="font-semibold text-[#111111]">₹{charge}</span>
                </div>
                <div className="border-t border-[#EAEAEA] pt-2 flex justify-between">
                  <span className="font-bold text-[#111111]">Total Payable</span>
                  <span className="text-xl font-black text-[#111111]">₹{total}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Place Order Action */}
          <motion.div
            custom={3}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            <Button
              variant="primary"
              size="xl"
              fullWidth
              loading={placing}
              onClick={handlePlaceOrder}
              icon={<ChevronRight size={18} />}
              iconPosition="right"
            >
              {placing ? "Placing Order…" : `Place Order · ₹${total}`}
            </Button>
            <p className="text-xs text-[#999999] text-center mt-3 leading-relaxed">
              Today's order will be delivered tomorrow to your selected map pin location.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
}
