import { AnimatePresence, motion } from "framer-motion";
import { X, Search as SearchIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchProducts, Product } from "../../data/products";
import { ProductImage } from "../ui/ProductImage";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setResults(searchProducts(query));
    }, 200);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleResultClick = (productId: string) => {
    onClose();
    navigate(`/products/${productId}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="search-overlay"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 350, damping: 32 }}
          className="fixed inset-0 bg-white z-50 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Search products"
        >
          {/* Input bar */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-[#EAEAEA]">
            <div className="flex-1 flex items-center gap-3 bg-[#F5F5F5] rounded-[14px] px-4 h-12">
              <SearchIcon size={18} className="text-[#999999] flex-shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-[#111111] placeholder-[#AAAAAA] text-sm font-medium focus:outline-none"
                aria-label="Search query"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-[#999999] hover:text-[#111111] transition-colors"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-sm font-semibold text-[#00A651] flex-shrink-0"
              aria-label="Cancel search"
            >
              Cancel
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {!query.trim() ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 pb-20">
                <SearchIcon size={48} className="text-[#EAEAEA]" />
                <p className="text-sm text-[#999999] font-medium">
                  Search for fresh greens, dry fruits, seeds...
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 pb-20">
                <span className="text-4xl">🔍</span>
                <p className="text-base font-bold text-[#111111]">
                  No products found
                </p>
                <p className="text-sm text-[#999999]">
                  Try "{query.length > 10 ? query.slice(0, 10) + "..." : query}"
                  in a different way
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F5F5F5]">
                {results.map((product, i) => (
                  <motion.button
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleResultClick(product.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[#F9F9F9] text-left"
                  >
                    <div className="w-12 h-12 rounded-[12px] overflow-hidden flex-shrink-0">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#111111] truncate">
                        {product.name}
                      </p>
                      {product.nameTamil && (
                        <p className="text-xs text-[#00A651] font-semibold truncate">
                          {product.nameTamil}
                        </p>
                      )}
                      <p className="text-xs text-[#999999] font-medium">
                        {product.unit}
                      </p>
                    </div>
                    <span className="text-sm font-black text-[#111111] flex-shrink-0">
                      ₹{product.price}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
