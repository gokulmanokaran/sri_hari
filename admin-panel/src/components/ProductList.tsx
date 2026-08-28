import { useState, useMemo } from "react";
import { Search, Image, Edit3, Trash2, CheckCircle2, XCircle, Plus, Star } from "lucide-react";
import { Product, Category } from "../types";

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onEditProduct: (product: Product) => void;
  onReplaceImage: (product: Product) => void;
  onToggleStock: (productId: string, currentStock: boolean) => void;
  onDeleteProduct: (product: Product) => void;
  onAddNewProduct: () => void;
  isUpdatingStockId: string | null;
}

export function ProductList({
  products,
  categories,
  onEditProduct,
  onReplaceImage,
  onToggleStock,
  onDeleteProduct,
  onAddNewProduct,
  isUpdatingStockId,
}: ProductListProps) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCat !== "all" && p.category !== selectedCat) {
        return false;
      }
      // Stock filter
      if (stockFilter === "in_stock" && !p.inStock) {
        return false;
      }
      if (stockFilter === "out_of_stock" && p.inStock) {
        return false;
      }
      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchTamil = (p.nameTamil || p.tamilName || "").toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchUnit = p.unit.toLowerCase().includes(q);
        if (!matchName && !matchTamil && !matchId && !matchUnit) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCat, stockFilter, search]);

  const getCategoryName = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    return found ? `${found.emoji} ${found.name}` : catId;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      {/* Search & Filters Header */}
      <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by English name, Tamil name, or ID..."
            className="w-full h-11 pl-10 pr-4 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-[#00A651] transition-all"
          />
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Category Dropdown */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="h-11 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#00A651]"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as "all" | "in_stock" | "out_of_stock")}
            className="h-11 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#00A651]"
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">✓ In Stock</option>
            <option value="out_of_stock">✗ Out of Stock</option>
          </select>

          {/* Add Product Shortcut */}
          <button
            onClick={onAddNewProduct}
            className="h-11 px-4 bg-[#00A651] hover:bg-[#008f45] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-[#00A651]/20 transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Product Count bar */}
      <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <span>
          Showing <strong className="text-white">{filteredProducts.length}</strong> of {products.length} products
        </span>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-[#00A651] hover:underline cursor-pointer"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Table / List */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-base font-bold text-white">No products found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or category filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4 sm:px-6">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Price</th>
                <th className="py-3.5 px-4">Unit / Qty</th>
                <th className="py-3.5 px-4 text-center">Stock Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredProducts.map((product) => {
                const isToggling = isUpdatingStockId === product.id;
                const displayName = product.name;
                const tamil = product.nameTamil || product.tamilName;

                return (
                  <tr
                    key={product.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Image + Title */}
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/80 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const current = target.src;
                                if (current.endsWith(".webp")) {
                                  target.src = current.replace(".webp", ".png");
                                } else if (current.endsWith(".png")) {
                                  target.src = current.replace(".png", ".jpg");
                                } else {
                                  target.onerror = null;
                                  target.src = "/favicon.svg";
                                }
                              }}
                            />
                          ) : (
                            <span className="text-xl">🌿</span>
                          )}
                          <button
                            onClick={() => onReplaceImage(product)}
                            title="Replace / Change Image"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                          >
                            <Image size={16} />
                          </button>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white truncate">{displayName}</span>
                            {product.featured && (
                              <Star size={12} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                            )}
                          </div>
                          {tamil && (
                            <p className="text-xs text-[#00A651] font-semibold truncate mt-0.5">
                              {tamil}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                            ID: {product.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                        {getCategoryName(product.category)}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right font-mono">
                      <span className="text-base font-black text-white">₹{product.price}</span>
                      {product.mrp && product.mrp > product.price && (
                        <div className="text-[11px] text-slate-500 line-through">
                          MRP: ₹{product.mrp}
                        </div>
                      )}
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-4 text-xs font-medium text-slate-300">
                      <div>{product.unit}</div>
                      {product.variants && product.variants.length > 0 && (
                        <span className="text-[10px] text-[#00A651] font-bold">
                          {product.variants.length} Variants
                        </span>
                      )}
                    </td>

                    {/* 1-Click Stock Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleStock(product.id, product.inStock)}
                        disabled={isToggling}
                        title={`Click to set ${product.inStock ? "Out of Stock" : "In Stock"}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          product.inStock
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"
                        } disabled:opacity-50`}
                      >
                        {isToggling ? (
                          <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : product.inStock ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} />
                            <span>Out of Stock</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 sm:px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Replace Image */}
                        <button
                          onClick={() => onReplaceImage(product)}
                          title="Replace Image Safely"
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Image size={14} />
                        </button>

                        {/* Edit Product */}
                        <button
                          onClick={() => onEditProduct(product)}
                          title="Edit Product Details"
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#00A651] hover:text-white text-slate-300 flex items-center justify-center border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Edit3 size={14} />
                        </button>

                        {/* Delete Product */}
                        <button
                          onClick={() => onDeleteProduct(product)}
                          title="Delete Product"
                          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 flex items-center justify-center border border-slate-700 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
