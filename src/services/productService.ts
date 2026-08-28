/**
 * Central Product Catalog Service
 * ────────────────────────────────
 * Fetches dynamic product and category data from the Central Online Product API.
 * Uses a stale-while-revalidate caching pattern:
 * 1. Immediately returns cached catalog for 0ms startup.
 * 2. Fetches latest catalog in background.
 * 3. Updates cache and notifies React context if changes are detected.
 * 4. Falls back safely to bundled catalog if offline.
 */
import { Product, PRODUCTS } from "../data/products";
import { Category, CATEGORIES } from "../data/categories";

const CACHED_PRODUCTS_KEY = "shreehari_cached_products_v2";
const CACHED_CATEGORIES_KEY = "shreehari_cached_categories_v2";
const CACHE_TIMESTAMP_KEY = "shreehari_catalog_last_synced";

/** Get API Base URL (defaults to current origin /api) */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_PRODUCT_API_URL || "/api";
}

/** Get cached products or fallback to bundled catalog */
export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(CACHED_PRODUCTS_KEY);
    if (!raw) return PRODUCTS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn("[ProductService] Error reading cached products:", err);
  }
  return PRODUCTS;
}

/** Get cached categories or fallback to bundled categories */
export function getStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(CACHED_CATEGORIES_KEY);
    if (!raw) return CATEGORIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn("[ProductService] Error reading cached categories:", err);
  }
  return CATEGORIES;
}

/** Save products to local cache */
export function cacheProducts(products: Product[]): void {
  try {
    localStorage.setItem(CACHED_PRODUCTS_KEY, JSON.stringify(products));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString());
  } catch (err) {
    console.warn("[ProductService] Error caching products:", err);
  }
}

/** Save categories to local cache */
export function cacheCategories(categories: Category[]): void {
  try {
    localStorage.setItem(CACHED_CATEGORIES_KEY, JSON.stringify(categories));
  } catch (err) {
    console.warn("[ProductService] Error caching categories:", err);
  }
}

/**
 * Fetches live products from the Central Product API
 */
export async function fetchLiveProducts(): Promise<Product[]> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/products`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[ProductService] API returned ${res.status}, falling back to cache.`);
      return getStoredProducts();
    }

    const data = await res.json();
    let productList: Product[] = [];

    if (data && Array.isArray(data.data)) {
      productList = data.data;
    } else if (Array.isArray(data)) {
      productList = data;
    } else if (data && Array.isArray(data.products)) {
      productList = data.products;
    }

    if (productList.length > 0) {
      cacheProducts(productList);
      return productList;
    }
  } catch (err) {
    console.info("[ProductService] Network issue while fetching live products. Serving cached data.", err);
  }

  return getStoredProducts();
}

/**
 * Fetches live categories from the Central Product API
 */
export async function fetchLiveCategories(): Promise<Category[]> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/categories`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      let catList: Category[] = [];

      if (data && Array.isArray(data.data)) {
        catList = data.data;
      } else if (Array.isArray(data)) {
        catList = data;
      }

      if (catList.length > 0) {
        cacheCategories(catList);
        return catList;
      }
    }
  } catch (err) {
    console.info("[ProductService] Could not reach live categories API. Serving cached data.", err);
  }

  return getStoredCategories();
}

/** Helper: Find product by ID in a given products array (including variant matches) */
export function findProductById(products: Product[], id: string): Product | undefined {
  const direct = products.find((p) => p.id === id);
  if (direct) return direct;

  const parent = products.find((p) => p.variants?.some((v) => v.id === id));
  if (parent && parent.variants) {
    const variant = parent.variants.find((v) => v.id === id);
    if (variant) {
      const isSugar = parent.variantType === "sugar";
      return {
        ...parent,
        id: variant.id,
        price: variant.price,
        unit: isSugar ? `${parent.unit} (${variant.unit})` : variant.unit,
        inStock: variant.inStock !== false && parent.inStock,
      };
    }
  }

  return undefined;
}

/** Helper: Search products in a given products array */
export function filterProductsByQuery(products: Product[], query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.nameTamil && p.nameTamil.toLowerCase().includes(q)) ||
      (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      p.unit.toLowerCase().includes(q) ||
      (p.note && p.note.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      p.variants?.some((v) => v.unit.toLowerCase().includes(q) || (v.name && v.name.toLowerCase().includes(q)))
  );
}
