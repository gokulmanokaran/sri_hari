import { useState } from "react";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { PromoCarousel } from "../components/features/PromoCarousel";
import { CategoryScroller } from "../components/features/CategoryScroller";
import { ProductGrid } from "../components/features/ProductGrid";
import { WhyChooseUs } from "../components/features/WhyChooseUs";
import { WhatsAppCTA } from "../components/features/WhatsAppCTA";
import { SearchOverlay } from "../components/features/SearchOverlay";
import { PRODUCTS } from "../data/products";

export default function HomePage() {
  const [searchOpen, setSearchOpen] = useState(false);

  // Featured curated picks
  const featuredProducts = PRODUCTS.filter((p) =>
    ["dwarf-copper-leaves", "small-onion", "almond", "black-dates"].includes(p.id)
  );

  // Fresh & Cleaned Products
  const freshProducts = PRODUCTS.filter((p) =>
    ["keerai", "vegetables"].includes(p.category)
  );

  // Premium Quality Products (Dry Fruits, Seeds, Healthy Choices)
  const premiumProducts = PRODUCTS.filter((p) =>
    ["dry-fruits", "seeds", "healthy-choices"].includes(p.category)
  );

  return (
    <>
      {/* 1. Header with search, call, profile, and Delivery Location pill (INTACT) */}
      <Header onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <main className="pb-24">
        {/* 2. Promotional / Pre-Order Banner Carousel */}
        <PromoCarousel />

        {/* 3. Shop by Category */}
        <div className="mt-4">
          <CategoryScroller />
        </div>

        {/* 4. Featured Products */}
        <div className="mt-6">
          <ProductGrid products={featuredProducts} title="Featured Products" />
        </div>

        {/* 5. Fresh & Cleaned Products */}
        <div className="mt-6">
          <ProductGrid products={freshProducts} title="Fresh Products" />
        </div>

        {/* 6. Premium Quality Products */}
        <div className="mt-6">
          <ProductGrid products={premiumProducts} title="Premium Quality Products" />
        </div>

        {/* 7. Why Choose Us */}
        <div className="mt-6">
          <WhyChooseUs />
        </div>

        {/* 8. Contact / WhatsApp */}
        <div className="mt-4">
          <WhatsAppCTA />
        </div>

        {/* 9. Footer */}
        <Footer />
      </main>
    </>
  );
}
