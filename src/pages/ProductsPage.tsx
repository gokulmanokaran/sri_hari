import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "../components/layout/Header";
import { CategoryScroller } from "../components/features/CategoryScroller";
import { ProductGrid } from "../components/features/ProductGrid";
import { SearchOverlay } from "../components/features/SearchOverlay";
import { PRODUCTS, ProductCategory } from "../data/products";
import { useSearchParams } from "react-router-dom";

export default function ProductsPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const initialCategory = searchParams.get("category") as ProductCategory | "all" | null;
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "all">(
    initialCategory || "all"
  );

  const filtered =
    activeCategory === "all"
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === activeCategory);

  const categoryLabel =
    activeCategory === "all" ? "All Products" : activeCategory.replace(/-/g, " ");

  return (
    <>
      <Header onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <main className="pb-24">
        {/* Page Title */}
        <div className="px-5 pt-4 pb-2">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-black text-[#111111] capitalize"
          >
            {categoryLabel}
          </motion.h1>
          <p className="text-sm text-[#999999] font-medium">{filtered.length} products</p>
        </div>

        {/* Category filter */}
        <CategoryScroller
          mode="filter"
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />

        <div className="h-4" />

        {/* Products */}
        <ProductGrid
          products={filtered}
          emptyMessage="No products in this category"
        />
      </main>
    </>
  );
}
