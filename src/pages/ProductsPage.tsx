import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "../components/layout/Header";
import { CategoryScroller } from "../components/features/CategoryScroller";
import { ProductGrid } from "../components/features/ProductGrid";
import { SearchOverlay } from "../components/features/SearchOverlay";
import { ProductCategory } from "../data/products";
import { useSearchParams } from "react-router-dom";
import { useProductCatalog } from "../store/ProductContext";

export default function ProductsPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const { products, categories } = useProductCatalog();

  const initialCategory = searchParams.get("category") as ProductCategory | "all" | null;
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "all">(
    initialCategory || "all"
  );

  const filtered =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category === activeCategory);

  const categoryLabel =
    activeCategory === "all"
      ? "All Products"
      : categories.find((c) => c.id === activeCategory)?.name || activeCategory.replace(/-/g, " ");

  return (
    <>
      <Header onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <main className="pb-24 max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="px-3 sm:px-4 pt-4 pb-2">
          <motion.h1
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="text-xl font-black text-[#111111] capitalize"
          >
            {categoryLabel}
          </motion.h1>
          <p className="text-sm text-[#888888] font-medium mt-0.5">{filtered.length} products available</p>
        </div>

        {/* Category filter pills */}
        <div className="px-3 sm:px-4">
          <CategoryScroller
            mode="filter"
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>

        <div className="h-3" />

        {/* Product grid — same side padding as title */}
        <div className="px-3 sm:px-4">
          <ProductGrid
            products={filtered}
            emptyMessage="No products in this category"
          />
        </div>
      </main>
    </>
  );
}
