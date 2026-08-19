import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Truck, Clock, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";

const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      staggerChildren: 0.08,
      ease: "easeOut" as const,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 320, damping: 26 },
  },
};

export function EcommerceHero() {
  const navigate = useNavigate();

  return (
    <section className="px-4 pt-3 pb-2 max-w-lg mx-auto" aria-label="Pre-order Announcement">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#00A651] via-[#087A43] to-[#065A31] p-5 text-white shadow-lg"
        style={{
          boxShadow: "0 10px 28px -6px rgba(0, 166, 81, 0.35)",
        }}
      >
        {/* Subtle geometric glass circles */}
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-[1px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-12 -left-10 w-32 h-32 rounded-full bg-white/5 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col gap-3.5">
          {/* Header Row: Badge & Fresh icon */}
          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-white/20">
              <Sparkles size={12} className="text-[#FFE9B8]" />
              PRE ORDER NOW
            </span>
            <span className="text-xs font-bold text-white/90 bg-black/20 px-2.5 py-0.5 rounded-full">
              🌿 100% Farm Fresh
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants}>
            <h1 className="text-xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
              Fresh Greens & Natural Foods Delivered to Your Doorstep
            </h1>
          </motion.div>

          {/* 4 Key Business Highlights in 2-Col Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2 pt-0.5">
            <div className="flex items-center gap-2 bg-white/12 backdrop-blur-sm rounded-[12px] p-2 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-[#FFE9B8]">
                ⭐
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-white leading-tight">Min. Order ₹80</p>
                <p className="text-[9px] text-white/75 font-medium truncate">Subtotal value</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/12 backdrop-blur-sm rounded-[12px] p-2 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white">
                <Truck size={12} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-white leading-tight">Distance Delivery</p>
                <p className="text-[9px] text-white/75 font-medium truncate">From ₹30 to ₹80</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/12 backdrop-blur-sm rounded-[12px] p-2 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white">
                <Clock size={12} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-white leading-tight">Before 11:00 AM</p>
                <p className="text-[9px] text-white/75 font-medium truncate">Order cutoff time</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/12 backdrop-blur-sm rounded-[12px] p-2 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-[#FFE9B8]">
                🚀
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold text-white leading-tight">Evening Delivery</p>
                <p className="text-[9px] text-white/75 font-medium truncate">Guaranteed drop</p>
              </div>
            </div>
          </motion.div>

          {/* Action Row */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 pt-1">
            <motion.button
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/products")}
              className="flex-1 h-11 bg-white text-[#087A43] hover:bg-[#FAF8F1] font-black text-sm rounded-[13px] shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer select-none"
              aria-label="Shop Now"
            >
              <ShoppingBag size={16} className="text-[#00A651]" />
              <span>Shop Now</span>
              <ArrowRight size={15} />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/products?category=keerai")}
              className="h-11 px-4 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-[13px] border border-white/20 transition-all cursor-pointer"
              aria-label="Explore Keerai"
            >
              Keerai 🌿
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
