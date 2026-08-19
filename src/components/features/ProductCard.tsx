import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Product } from "../../data/products";
import { useCart } from "../../store/CartContext";
import { ProductImage } from "../ui/ProductImage";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem, incrementItem, decrementItem, getItemQuantity } = useCart();
  const navigate = useNavigate();
  const qty = getItemQuantity(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    incrementItem(product.id);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    decrementItem(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        delay: (index % 4) * 0.07,
        type: "spring",
        stiffness: 280,
        damping: 26,
      }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/products/${product.id}`)}
      className="bg-white rounded-[16px] border border-[#EAEAEA] overflow-hidden cursor-pointer relative"
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
      role="article"
      aria-label={`${product.name}, ₹${product.price} per ${product.unit}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <ProductImage
          src={product.image}
          alt={product.name}
          className="w-full rounded-none"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-bold text-[#666666] bg-white/90 px-2 py-1 rounded-full">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <h3 className="text-[13px] font-bold text-[#111111] line-clamp-2 leading-tight mb-0.5">
          {product.name}
        </h3>
        <p className="text-[11px] text-[#999999] font-medium mb-2">
          {product.unit}
          {product.note && ` · ${product.note}`}
        </p>

        <div className="flex items-center justify-between gap-1">
          <span className="text-sm font-black text-[#111111]">
            ₹{product.price}
          </span>

          {/* Add / Qty control */}
          <AnimatePresence mode="wait" initial={false}>
            {qty === 0 ? (
              <motion.button
                key="add"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                disabled={!product.inStock}
                onClick={handleAdd}
                className="h-7 px-3 bg-[#00A651] text-white text-xs font-bold rounded-full flex items-center gap-1 disabled:opacity-50 shrink-0"
                aria-label={`Add ${product.name} to cart`}
              >
                <Plus size={11} strokeWidth={3} />
                Add
              </motion.button>
            ) : (
              <motion.div
                key="qty"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                className="flex items-center gap-1 bg-[#EAF8F0] rounded-full px-1"
              >
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleDecrement}
                  className="w-6 h-6 bg-[#00A651] text-white rounded-full flex items-center justify-center flex-shrink-0"
                  aria-label={`Remove one ${product.name}`}
                >
                  <Minus size={10} strokeWidth={3} />
                </motion.button>
                <motion.span
                  key={qty}
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="text-xs font-black text-[#00A651] w-5 text-center"
                >
                  {qty}
                </motion.span>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleIncrement}
                  className="w-6 h-6 bg-[#00A651] text-white rounded-full flex items-center justify-center flex-shrink-0"
                  aria-label={`Add another ${product.name}`}
                >
                  <Plus size={10} strokeWidth={3} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
