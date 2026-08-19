import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Truck, Clock } from "lucide-react";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../store/CartContext";
import { useDelivery } from "../store/DeliveryContext";
import { Button } from "../components/ui/Button";
import {
  validateCheckoutForm,
  CheckoutFormData,
  CheckoutErrors,
} from "../utils/validation";
import { MINIMUM_ORDER_VALUE, DELIVERY_CUTOFF_TIME } from "../data/deliveryZones";

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, type: "spring" as const, stiffness: 280, damping: 28 },
  }),
};

function FormField({
  id,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-bold text-[#666666] mb-1.5 uppercase tracking-wide"
      >
        {label}
      </label>
      <input
        id={id}
        className={`w-full h-12 px-4 border-2 rounded-[12px] text-sm font-medium focus:outline-none transition-colors ${
          error
            ? "border-red-400 bg-red-50"
            : "border-[#EAEAEA] focus:border-[#00A651]"
        }`}
        {...props}
      />
      {error && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-xs mt-1 font-medium"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const { pincode, deliveryCharge } = useDelivery();

  const charge = deliveryCharge ?? 0;
  const total = subtotal + charge;

  const [form, setForm] = useState<CheckoutFormData>({
    name: "",
    phone: "",
    address: "",
    area: "",
    city: "Coimbatore",
    pincode: pincode,
  });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [placing, setPlacing] = useState(false);

  // Redirect if cart empty or min order not met
  if (items.length === 0 || subtotal < MINIMUM_ORDER_VALUE) {
    return null; // Handled by navigation guard
  }

  const handleChange = useCallback(
    (field: keyof CheckoutFormData) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      },
    []
  );

  const handlePlaceOrder = async () => {
    const newErrors = validateCheckoutForm(form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorEl = document.querySelector('[role="alert"]');
      firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setPlacing(true);
    await new Promise((r) => setTimeout(r, 1000));

    const orderId = `SHK${Date.now().toString().slice(-6)}`;
    clearCart();
    navigate("/order-success", {
      replace: true,
      state: {
        orderId,
        total,
        subtotal,
        deliveryCharge: charge,
        pincode: form.pincode,
        name: form.name,
      },
    });
  };

  return (
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
        {/* Section 1: Delivery Address */}
        <motion.div
          custom={0}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-[20px] border border-[#EAEAEA] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EAEAEA] bg-[#F9F9F9]">
            <div className="w-6 h-6 rounded-full bg-[#00A651] text-white text-xs font-black flex items-center justify-center">
              1
            </div>
            <h2 className="text-sm font-bold text-[#111111]">Delivery Address</h2>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <FormField
              id="checkout-name"
              label="Full Name"
              value={form.name}
              onChange={handleChange("name")}
              placeholder="Your full name"
              error={errors.name}
              autoComplete="name"
            />
            <FormField
              id="checkout-phone"
              label="Mobile Number"
              value={form.phone}
              onChange={handleChange("phone")}
              placeholder="10-digit mobile number"
              error={errors.phone}
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
            />
            <FormField
              id="checkout-address"
              label="Address"
              value={form.address}
              onChange={handleChange("address")}
              placeholder="Door no., Street, Landmark"
              error={errors.address}
              autoComplete="street-address"
            />
            <FormField
              id="checkout-area"
              label="Area (Optional)"
              value={form.area}
              onChange={handleChange("area")}
              placeholder="Area / Locality"
              autoComplete="address-level3"
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                id="checkout-city"
                label="City"
                value={form.city}
                onChange={handleChange("city")}
                placeholder="City"
                error={errors.city}
                autoComplete="address-level2"
              />
              <FormField
                id="checkout-pincode"
                label="Pincode"
                value={form.pincode}
                onChange={handleChange("pincode")}
                placeholder="6-digit pincode"
                error={errors.pincode}
                type="tel"
                inputMode="numeric"
                maxLength={6}
                autoComplete="postal-code"
              />
            </div>
          </div>
        </motion.div>

        {/* Section 2: Delivery Method */}
        <motion.div
          custom={1}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-[20px] border border-[#EAEAEA] overflow-hidden"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#EAEAEA] bg-[#F9F9F9]">
            <div className="w-6 h-6 rounded-full bg-[#00A651] text-white text-xs font-black flex items-center justify-center">
              2
            </div>
            <h2 className="text-sm font-bold text-[#111111]">Delivery Method</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-4 bg-[#EAF8F0] rounded-[16px] p-4 border-2 border-[#00A651]">
              <div className="w-11 h-11 bg-[#00A651] rounded-[12px] flex items-center justify-center flex-shrink-0">
                <Truck size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#111111]">
                  Tomorrow Evening Delivery
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={11} className="text-[#666666]" />
                  <p className="text-xs text-[#666666]">
                    Order before {DELIVERY_CUTOFF_TIME}
                  </p>
                </div>
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
          className="bg-white rounded-[20px] border border-[#EAEAEA] overflow-hidden"
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
                  <span className="text-[#666666] flex-1 truncate mr-3">
                    {item.product.name} × {item.quantity}
                  </span>
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
              <div className="flex justify-between text-sm">
                <span className="text-[#666666]">Delivery Charge</span>
                <span className="font-semibold text-[#111111]">₹{charge}</span>
              </div>
              <div className="border-t border-[#EAEAEA] pt-2 flex justify-between">
                <span className="font-bold text-[#111111]">Total</span>
                <span className="text-xl font-black text-[#111111]">₹{total}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Place Order */}
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
            Place Order · ₹{total}
          </Button>
          <p className="text-xs text-[#999999] text-center mt-3 leading-relaxed">
            By placing your order, you agree to our delivery terms.
            Order before {DELIVERY_CUTOFF_TIME} for evening delivery.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
