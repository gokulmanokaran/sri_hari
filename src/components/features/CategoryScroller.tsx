import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../../data/categories";
import { ProductCategory } from "../../data/products";

interface CategoryScrollerProps {
  activeCategory?: ProductCategory | "all";
  onSelect?: (id: ProductCategory | "all") => void;
  mode?: "home" | "filter";
}

export function CategoryScroller({
  activeCategory,
  onSelect,
  mode = "home",
}: CategoryScrollerProps) {
  const navigate = useNavigate();

  const handleClick = (id: ProductCategory) => {
    if (onSelect) {
      onSelect(id);
    } else {
      navigate(`/products?category=${id}`);
    }
  };

  if (mode === "filter") {
    // Compact pill filter for products page
    return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={() => onSelect?.("all")}
          className={`flex-shrink-0 px-4 h-9 rounded-full text-sm font-semibold transition-colors ${
            activeCategory === "all"
              ? "bg-[#00A651] text-white"
              : "bg-[#F5F5F5] text-[#666666] hover:bg-[#EAF8F0] hover:text-[#00A651]"
          }`}
        >
          All
        </motion.button>
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat.id}
            whileTap={{ scale: 0.93 }}
            onClick={() => handleClick(cat.id)}
            className={`flex-shrink-0 px-4 h-9 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
              activeCategory === cat.id
                ? "bg-[#00A651] text-white"
                : "bg-[#F5F5F5] text-[#666666] hover:bg-[#EAF8F0] hover:text-[#00A651]"
            }`}
          >
            {cat.name}
          </motion.button>
        ))}
      </div>
    );
  }

  // Home mode: full cards
  return (
    <section aria-label="Shop by category">
      <div className="px-5 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-black text-[#111111]">Shop by Category</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1">
        {CATEGORIES.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 28 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => handleClick(cat.id)}
            className="flex-shrink-0 flex flex-col items-center gap-2 w-[76px]"
            aria-label={cat.name}
          >
            {/* Icon card */}
            <div
              className="w-14 h-14 rounded-[18px] flex items-center justify-center text-2xl shadow-sm border border-white"
              style={{ background: cat.color }}
            >
              {cat.emoji}
            </div>
            <span className="text-[11px] font-semibold text-[#333333] text-center leading-tight">
              {cat.name}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
