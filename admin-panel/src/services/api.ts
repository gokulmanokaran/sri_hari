import { Product, Category, AdminSession } from "../types";
import { INITIAL_PRODUCTS } from "./initialProducts";

const AUTH_TOKEN_KEY = "shk_admin_auth_token";
const AUTH_SESSION_KEY = "shk_admin_session";
const LOCAL_CATALOG_KEY = "shk_admin_local_products_v2";
const LOCAL_CATEGORIES_KEY = "shk_admin_local_categories_v2";

export function getApiBaseUrl(): string {
  // If VITE_API_URL is set, use it; otherwise use relative /api
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "/api";
}

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AdminSession): void {
  localStorage.setItem(AUTH_TOKEN_KEY, session.token);
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_SESSION_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken() || "shreehari_admin_secure_2026";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "x-admin-key": token,
  };
}

// ── Admin Authentication
export async function authenticateAdmin(passwordOrPin: string): Promise<AdminSession> {
  const clean = (passwordOrPin || "").trim();
  const baseUrl = getApiBaseUrl();

  // 1. Authenticate against central server
  try {
    const res = await fetch(`${baseUrl}/admin/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: clean, password: clean }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success) {
      const session: AdminSession = {
        token: data.token || "shk_token_admin_2026",
        role: data.role || "admin",
        storeName: data.storeName || "Shree Hari Keerai",
        issuedAt: new Date().toISOString(),
      };
      saveSession(session);
      return session;
    } else if (data.error && res.status === 401) {
      throw new Error(data.error);
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes("Invalid")) {
      throw err;
    }
    console.warn("[AdminAuth] API server unreachable. Checking local credentials.");
  }

  // 2. Standalone / Local Dev Fallback Validation
  const validCredentials = ["2026", "2026b", "admin2026", "shreehari2026", "shreehari_admin_secure_2026"];
  if (validCredentials.includes(clean) || clean.toLowerCase() === "2026" || clean.toLowerCase() === "2026b") {
    const session: AdminSession = {
      token: "shk_token_admin_2026",
      role: "admin",
      storeName: "Shree Hari Keerai",
      issuedAt: new Date().toISOString(),
    };
    saveSession(session);
    return session;
  }

  throw new Error("Invalid Administrator PIN or password. (Default PIN: 2026)");
}

// ── Products API — reads from Central Online Product API
export async function fetchProducts(): Promise<Product[]> {
  const baseUrl = getApiBaseUrl();

  try {
    const res = await fetch(`${baseUrl}/products?_ts=${Date.now()}`, {
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : Array.isArray(data.products)
        ? data.products
        : [];

      if (list.length > 0) {
        localStorage.setItem(LOCAL_CATALOG_KEY, JSON.stringify(list));
        return list;
      }
    }
  } catch (err) {
    console.warn("[AdminApi] Could not reach live products API, reading from cache:", err);
  }

  // Fallback: localStorage
  try {
    const stored = localStorage.getItem(LOCAL_CATALOG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return INITIAL_PRODUCTS;
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
  const newProduct: Product = {
    id: product.id || `prod_${Date.now().toString(36)}`,
    name: product.name || "Untitled Product",
    nameTamil: product.nameTamil || product.tamilName || "",
    tamilName: product.tamilName || product.nameTamil || "",
    price: Number(product.price) || 0,
    mrp: Number(product.mrp) || Number(product.price) || 0,
    unit: product.unit || "1 Pack",
    quantity: product.quantity || product.unit || "1 Pack",
    category: product.category || "keerai",
    image: product.image || "",
    inStock: product.inStock !== false,
    stockQuantity: product.stockQuantity,
    featured: Boolean(product.featured),
    active: product.active !== false,
    description: product.description || "",
    shortDescription: product.shortDescription || "",
    note: product.note || "",
    variantType: product.variantType,
    variants: product.variants,
    updatedAt: new Date().toISOString(),
  };

  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/products`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(newProduct),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Server responded with status ${res.status} while saving product.`);
  }

  const savedProduct: Product = data.data || newProduct;

  // Update local cache only after confirmed server persistence
  try {
    const products = await fetchProducts();
    const updated = [savedProduct, ...products.filter((p) => p.id !== savedProduct.id)];
    localStorage.setItem(LOCAL_CATALOG_KEY, JSON.stringify(updated));
  } catch {
    // non-fatal
  }

  return savedProduct;
}

export async function updateProduct(product: Partial<Product> & { id: string }): Promise<Product> {
  const baseUrl = getApiBaseUrl();

  const res = await fetch(`${baseUrl}/products`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(product),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Server responded with status ${res.status} while updating product.`);
  }

  const savedProduct: Product = data.data || product;

  // Update local cache only after confirmed server persistence
  try {
    const products = await fetchProducts();
    const updated = products.map((p) => (p.id === savedProduct.id ? { ...p, ...savedProduct } : p));
    localStorage.setItem(LOCAL_CATALOG_KEY, JSON.stringify(updated));
  } catch {
    // non-fatal
  }

  return savedProduct;
}

export async function toggleProductStock(id: string, inStock: boolean): Promise<Product> {
  return updateProduct({ id, inStock });
}

export async function deleteProduct(id: string): Promise<boolean> {
  const baseUrl = getApiBaseUrl();

  const res = await fetch(`${baseUrl}/products`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    body: JSON.stringify({ id }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Server responded with status ${res.status} while deleting product.`);
  }

  try {
    const products = await fetchProducts();
    localStorage.setItem(LOCAL_CATALOG_KEY, JSON.stringify(products.filter((p) => p.id !== id)));
  } catch {
    // non-fatal
  }

  return true;
}

// ── Categories API
export async function fetchCategories(): Promise<Category[]> {
  const baseUrl = getApiBaseUrl();

  try {
    const res = await fetch(`${baseUrl}/categories?_ts=${Date.now()}`, {
      headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      if (list.length > 0) {
        localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(list));
        return list;
      }
    }
  } catch (err) {
    console.warn("[AdminApi] Categories API unreachable, reading from cache:", err);
  }

  try {
    const stored = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }

  return [
    { id: "keerai", name: "Greens (Keerai)", emoji: "🌿", description: "Fresh leafy greens", color: "#EAF8F0", sortOrder: 1, active: true },
    { id: "microgreens", name: "Microgreens", emoji: "🌱", description: "Nutrient-packed microgreens (40g Pack)", color: "#E8F5E9", sortOrder: 2, active: true },
    { id: "vegetables", name: "Cut Vegetables", emoji: "🧅", description: "Ready-to-use cut vegetables", color: "#FFF8E7", sortOrder: 3, active: true },
    { id: "cut-fruits", name: "Cut Fruits", emoji: "🍓", description: "Fresh cut fruits", color: "#FFF0F5", sortOrder: 4, active: true },
    { id: "sprouts", name: "Sprouts", emoji: "🫘", description: "Fresh & nutritious sprouts", color: "#F0FFF4", sortOrder: 5, active: true },
    { id: "fresh-juices", name: "Fresh Juices", emoji: "🥤", description: "Freshly squeezed juices", color: "#FFFBE6", sortOrder: 6, active: true },
    { id: "premium-products", name: "Natural Powders", emoji: "✨", description: "Pure natural herbal powders", color: "#FAF0FF", sortOrder: 7, active: true },
    { id: "nuts-seeds", name: "Nuts & Seeds", emoji: "🥜", description: "Nutritious nuts & seeds", color: "#FFF5E6", sortOrder: 8, active: true },
    { id: "healthy-snacks", name: "Healthy Snacks", emoji: "🍿", description: "Guilt-free healthy snacks", color: "#F5FCF8", sortOrder: 9, active: true },
    { id: "seasonal-exotic-fruits", name: "Seasonal & Exotic Fruits", emoji: "🍍", description: "Seasonal & exotic fruits", color: "#FFF8EE", sortOrder: 10, active: true },
    { id: "mushrooms", name: "Mushrooms", emoji: "🍄", description: "Fresh & dried mushrooms", color: "#F5F0FF", sortOrder: 11, active: true },
    { id: "cold-pressed-oil", name: "Cold Pressed Oil", emoji: "🫙", description: "Pure cold pressed oils", color: "#FFFAEB", sortOrder: 12, active: true },
  ];
}

export async function saveCategory(category: Partial<Category>): Promise<Category> {
  const newCat: Category = {
    id: category.id || `cat_${Date.now()}`,
    name: category.name || "Category",
    emoji: category.emoji || "📦",
    description: category.description || "",
    color: category.color || "#EAF8F0",
    sortOrder: category.sortOrder || 99,
    active: category.active !== false,
  };

  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/categories`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(newCat),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.error || `Server responded with status ${res.status} while saving category.`);
  }

  const savedCat: Category = data.data || newCat;

  try {
    const existing = await fetchCategories();
    const updated = [...existing.filter((c) => c.id !== savedCat.id), savedCat];
    localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(updated));
  } catch {
    // non-fatal
  }

  return savedCat;
}

// ── Safe Image Upload & Verification
export async function uploadProductImage(
  imagePayload: string,
  imageName?: string,
  productId?: string
): Promise<{ imageUrl: string; verified: boolean }> {
  const baseUrl = getApiBaseUrl();

  const res = await fetch(`${baseUrl}/admin/upload-image`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ image: imagePayload, imageName, productId }),
  });

  const data = await res.json().catch(() => ({}));

  if (res.ok && data.success && data.imageUrl) {
    return {
      imageUrl: data.imageUrl,
      verified: Boolean(data.verified),
    };
  }

  throw new Error(data.error || "Failed to upload and verify image on server.");
}
