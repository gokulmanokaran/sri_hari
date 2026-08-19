import { useState, useMemo } from "react";
import {
  PRODUCTS,
  Product,
  ProductCategory,
  getProductsByCategory,
  getProductById,
  searchProducts,
} from "../data/products";

export function useProducts(initialCategory?: ProductCategory | "all") {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">(
    initialCategory || "all"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const products = useMemo(() => {
    let list: Product[] = PRODUCTS;
    if (selectedCategory && selectedCategory !== "all") {
      list = getProductsByCategory(selectedCategory);
    }
    if (searchQuery.trim()) {
      list = searchProducts(searchQuery);
    }
    return list;
  }, [selectedCategory, searchQuery]);

  return {
    products,
    allProducts: PRODUCTS,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    getProductById,
  };
}
