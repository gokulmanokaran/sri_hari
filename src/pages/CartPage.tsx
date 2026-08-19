import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../store/CartContext";
import { useDelivery } from "../store/DeliveryContext";
import { ProductImage } from "../components/ui/ProductImage";
import { Button } from "../components/ui/Button";
import { MINIMUM_ORDER_VALUE } from "../data/deliveryZones";

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    itemCount,
    subtotal,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
  } = useCart();
  const { deliveryCharge } = useDelivery();

  const charge = deliveryCharge ?? 0;
  const total = subtotal + charge;
  const shortfall = Math.max(0, MINIMUM_ORDER_VALUE - subtotal);
  const canCheckout = subtotal >= MINIMUM_ORDER_VALUE;

  if (items.length === 0) {
    return (
      <div className="min-h-dvh flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#EAEAEA] bg-white sticky top-0 z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-black text-[#111111]">Your Cart</h1>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 pb-20">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <div className="w-24 h-24 bg-[#EAF8F0] rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={40} className="text-[#00A651]" strokeWidth={1.5} />
            </div>
          </motion.div>
          <h2 className="text-xl font-black text-[#111111]">
            Your cart is waiting
          </h2>
          <p className="text-sm text-[#999999] text-center">
            Your cart is waiting for something fresh 🌿
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate("/products")}
          >
            Start Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#EAEAEA] bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-black text-[#111111]">
            Cart ({itemCount})
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
          aria-label="Clear all items from cart"
        >
          Clear all
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {/* Minimum order notice */}
        {!canCheckout && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-[14px] px-4 py-3"
          >
            <p className="text-amber-800 text-sm font-semibold">
              Add ₹{shortfall} more to place your order.
            </p>
            <p className="text-amber-600 text-xs mt-0.5">
              Minimum order value is ₹{MINIMUM_ORDER_VALUE}
            </p>
          </motion.div>
        )}

        {/* Cart items */}
        <div className="px-4 py-4 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-white rounded-[16px] p-3 flex gap-3 border border-[#EAEAEA]"
                style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
              >
                {/* Image */}
                <div className="w-16 h-16 rounded-[12px] overflow-hidden flex-shrink-0">
                  <ProductImage
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#111111] truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-xs text-[#999999] font-medium">
                    {item.product.unit}
                    {item.product.note ? ` · ${item.product.note}` : ""}
                  </p>
                  <p className="text-xs text-[#00A651] font-semibold mt-0.5">
                    {item.product.inStock ? "In Stock" : "Unavailable"}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    {/* Qty control */}
                    <div className="flex items-center gap-2 bg-[#EAF8F0] rounded-full px-1.5 py-1">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => decrementItem(item.product.id)}
                        className="w-6 h-6 bg-[#00A651] text-white rounded-full flex items-center justify-center cursor-pointer"
                        aria-label={`Decrease ${item.product.name} quantity`}
                      >
                        <Minus size={10} strokeWidth={3} />
                      </motion.button>
                      <motion.span
                        key={item.quantity}
                        initial={{ scale: 0.7 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                        className="text-sm font-black text-[#00A651] w-5 text-center"
                      >
                        {item.quantity}
                      </motion.span>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => incrementItem(item.product.id)}
                        className="w-6 h-6 bg-[#00A651] text-white rounded-full flex items-center justify-center cursor-pointer"
                        aria-label={`Increase ${item.product.name} quantity`}
                      >
                        <Plus size={10} strokeWidth={3} />
                      </motion.button>
                    </div>

                    {/* Price + remove */}
                    <div className="flex items-center gap-2">
                      <motion.span
                        key={item.quantity * item.product.price}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        className="text-sm font-black text-[#111111]"
                      >
                        ₹{item.product.price * item.quantity}
                      </motion.span>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                        aria-label={`Remove ${item.product.name} from cart`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order summary */}
        <div className="mx-4 mb-4 bg-white rounded-[16px] border border-[#EAEAEA] overflow-hidden">
          <div className="p-4 border-b border-[#EAEAEA]">
            <h2 className="text-sm font-bold text-[#111111]">Order Summary</h2>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#666666]">Subtotal ({itemCount} items)</span>
              <span className="font-semibold text-[#111111]">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#666666]">Delivery Charge</span>
              <span className="font-semibold text-[#111111]">₹{charge}</span>
            </div>
            <div className="border-t border-[#EAEAEA] pt-2 flex justify-between">
              <span className="font-bold text-[#111111]">Total</span>
              <span className="font-black text-lg text-[#111111]">₹{total}</span>
            </div>
          </div>
        </div>

        {/* Proceed button */}
        <div className="px-4 pb-12">
          <Button
            variant="primary"
            size="xl"
            fullWidth
            disabled={!canCheckout}
            onClick={() => navigate("/checkout")}
          >
            {canCheckout
              ? `Proceed to Checkout · ₹${total}`
              : `Add ₹${shortfall} more to proceed`}
          </Button>
        </div>
      </div>
    </div>
  );
}
