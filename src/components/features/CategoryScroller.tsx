import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ProductCategory } from "../../data/products";
import { useProductCatalog } from "../../store/ProductContext";

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
  const { categories } = useProductCatalog();

  const handleClick = (id: string) => {
    if (onSelect) {
      onSelect(id as ProductCategory);
    } else {
      navigate(`/products?category=${id}`);
    }
  };

  if (mode === "filter") {
    // Compact pill filter for products page
    return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 -mx-0.5 px-0.5">
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
        {categories.map((cat) => (
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

  // Home mode: 3-per-row big size clean UI category grid with original icons
  return (
    <section aria-label="Shop by category" className="py-2">
      <div className="px-1 mb-3.5 flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#111111] tracking-tight">
            Shop by Category
          </h2>
          <p className="text-xs text-[#777777] font-medium mt-0.5">
            Tap a category to explore fresh products
          </p>
        </div>
        <span className="text-[11px] font-bold text-[#087A43] bg-[#EAF8F0] border border-[#00A651]/20 px-2.5 py-0.5 rounded-full flex-shrink-0">
          {categories.length} Categories
        </span>
      </div>

      {/* 3-Column Grid on Mobile, 4-6 on Desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 px-0.5">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, type: "spring", stiffness: 350, damping: 25 }}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => handleClick(cat.id)}
            className="flex flex-col items-center justify-between p-2.5 sm:p-3.5 rounded-[20px] bg-white hover:bg-[#F8FCF9] border border-[#EAEAEA] hover:border-[#00A651]/35 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer group select-none text-center aspect-[1/1.12]"
            aria-label={`Shop ${cat.name}`}
          >
            {/* Big Icon / Emoji Badge */}
            <div
              className="w-13 h-13 sm:w-15 sm:h-15 rounded-[16px] sm:rounded-[18px] flex items-center justify-center text-2xl sm:text-3xl shadow-2xs border border-white transition-transform duration-200 group-hover:scale-110"
              style={{ background: cat.color }}
            >
              {cat.emoji}
            </div>

            {/* Category Name */}
            <span className="text-[11.5px] sm:text-xs font-bold text-[#1E293B] group-hover:text-[#00A651] text-center leading-tight line-clamp-2 transition-colors px-0.5 mt-1">
              {cat.name}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
