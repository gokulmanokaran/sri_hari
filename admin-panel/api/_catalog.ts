// api/_catalog.ts
// Lean runtime-only catalog engine.
// All product/category DATA lives in data/catalog.json (deployed with the repo).
// Writes are persisted to GitHub so the JSON is updated for all future deployments.

import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface ProductVariant {
  id: string;
  name?: string;
  unit: string;
  price: number;
  inStock?: boolean;
}

export interface Product {
  id: string;
  name: string;
  nameTamil?: string;
  tamilName?: string;
  price: number;
  mrp?: number;
  unit: string;
  quantity?: string;
  category: string;
  description?: string;
  shortDescription?: string;
  note?: string;
  image?: string;
  inStock: boolean;
  stockQuantity?: number;
  featured?: boolean;
  active?: boolean;
  sortOrder?: number;
  variantType?: "weight" | "sugar";
  variants?: ProductVariant[];
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  sortOrder?: number;
  active?: boolean;
}

// ─── Serverless in-memory cache (per instance lifetime) ──────────────────────
let _cachedProducts: Product[] | null = null;
let _cachedCategories: Category[] | null = null;
let _cachedGithubSha: string | null = null;

// ─── Read catalog.json (bundled with deployment) ──────────────────────────────
function readBundledCatalog(): { products: Product[]; categories: Category[] } {
  try {
    const filePath = resolve(process.cwd(), "data/catalog.json");
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.products) && parsed.products.length > 0) {
      return {
        products: parsed.products,
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      };
    }
  } catch (e) {
    console.warn("[Catalog] Could not read data/catalog.json:", e);
  }
  return { products: [], categories: [] };
}

// ─── GitHub API helpers ───────────────────────────────────────────────────────
const GH_REPO = "gokulmanokaran/sri_hari";
const GH_FILE = "data/catalog.json";

async function githubGetFileSha(token: string): Promise<string | null> {
  if (_cachedGithubSha) return _cachedGithubSha;
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Sri-Hari-Admin-API",
        },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const data = (await res.json()) as { sha?: string };
      _cachedGithubSha = data.sha || null;
      return _cachedGithubSha;
    }
  } catch (e) {
    console.warn("[GitHub] Failed to fetch SHA:", e);
  }
  return null;
}

async function githubWriteCatalog(
  token: string,
  products: Product[],
  categories: Category[]
): Promise<boolean> {
  const sha = await githubGetFileSha(token);
  const payload = {
    products,
    categories,
    updatedAt: new Date().toISOString(),
  };
  const contentBase64 = Buffer.from(JSON.stringify(payload, null, 2)).toString("base64");

  try {
    const body: Record<string, unknown> = {
      message: `chore: update catalog via admin panel [${new Date().toISOString()}]`,
      content: contentBase64,
    };
    if (sha) body.sha = sha;

    const res = await fetch(
      `https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "Sri-Hari-Admin-API",
        },
        body: JSON.stringify(body),
      }
    );

    if (res.ok) {
      const data = (await res.json()) as { content?: { sha?: string } };
      _cachedGithubSha = data.content?.sha || null;
      return true;
    }
    const errText = await res.text();
    console.warn("[GitHub] Write failed:", res.status, errText);
    return false;
  } catch (e) {
    console.warn("[GitHub] Write exception:", e);
    return false;
  }
}

// ─── Public catalog getters ───────────────────────────────────────────────────
export async function getCloudProducts(): Promise<Product[]> {
  if (_cachedProducts && _cachedProducts.length > 0) return _cachedProducts;
  const { products, categories } = readBundledCatalog();
  _cachedProducts = products;
  _cachedCategories = categories;
  return _cachedProducts;
}

export async function getCloudCategories(): Promise<Category[]> {
  if (_cachedCategories && _cachedCategories.length > 0) return _cachedCategories;
  const { products, categories } = readBundledCatalog();
  _cachedProducts = products;
  _cachedCategories = categories;
  return _cachedCategories;
}

export interface StorageStatus {
  persistent: boolean;
  provider: "github" | "local_fs" | "memory";
  message: string;
}

// ─── Public catalog savers ────────────────────────────────────────────────────
export async function saveCloudProducts(products: Product[]): Promise<StorageStatus> {
  _cachedProducts = products;
  const cats = _cachedCategories || (await getCloudCategories());
  return saveToStorage(products, cats);
}

export async function saveCloudCategories(categories: Category[]): Promise<StorageStatus> {
  _cachedCategories = categories;
  const prods = _cachedProducts || (await getCloudProducts());
  return saveToStorage(prods, categories);
}

async function saveToStorage(
  products: Product[],
  categories: Category[]
): Promise<StorageStatus> {
  // 1. Try GitHub API (persistent across deployments)
  const ghToken =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT ||
    "";

  if (ghToken) {
    const ok = await githubWriteCatalog(ghToken, products, categories);
    if (ok) {
      return {
        persistent: true,
        provider: "github",
        message: "Catalog saved to GitHub. Changes will be live on next Vercel deployment trigger.",
      };
    }
  }

  // 2. Try local filesystem (works only in local dev)
  try {
    const { writeFileSync, mkdirSync, existsSync } = await import("fs");
    const { resolve: res, dirname } = await import("path");
    const filePath = res(process.cwd(), "data/catalog.json");
    const dir = dirname(filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const payload = { products, categories, updatedAt: new Date().toISOString() };
    writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
    return {
      persistent: true,
      provider: "local_fs",
      message: "Catalog saved to local data/catalog.json.",
    };
  } catch {
    // Read-only filesystem (Vercel serverless) — expected in production without GITHUB_TOKEN
  }

  return {
    persistent: false,
    provider: "memory",
    message:
      "Saved in serverless memory only. Add GITHUB_TOKEN to Vercel environment variables for permanent persistence.",
  };
}

export function getLastCatalogUpdate(): string {
  return new Date().toISOString();
}

// ─── CORS helper ──────────────────────────────────────────────────────────────
export function handleCors(req: any, res?: any): boolean {
  if (res && typeof res.setHeader === "function") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Key");
  }
  if ((req.method || "").toUpperCase() === "OPTIONS") {
    if (res && typeof res.status === "function") res.status(200).end();
    return true;
  }
  return false;
}

// ─── Request parser ───────────────────────────────────────────────────────────
export interface ParsedRequest {
  method: string;
  query: Record<string, string>;
  body: any;
  getHeader: (name: string) => string | undefined;
}

export async function parseApiRequest(req: any): Promise<ParsedRequest> {
  const method = (req.method || "GET").toUpperCase();

  // Extract headers
  const headers: Record<string, string> = {};
  if (req.headers) {
    if (typeof req.headers.forEach === "function") {
      req.headers.forEach((v: string, k: string) => { headers[k.toLowerCase()] = v; });
    } else {
      for (const k in req.headers) headers[k.toLowerCase()] = String(req.headers[k]);
    }
  }
  const getHeader = (name: string) => headers[name.toLowerCase()];

  // Extract query params
  const query: Record<string, string> = {};
  if (req.query && typeof req.query === "object") {
    for (const k in req.query) query[k] = String(req.query[k]);
  } else if (req.url) {
    const qIdx = req.url.indexOf("?");
    if (qIdx >= 0) {
      new URLSearchParams(req.url.slice(qIdx)).forEach((v, k) => { query[k] = v; });
    }
  }

  // Extract body
  let body: any = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { /* keep */ }
  } else if (!body && typeof req.json === "function") {
    try { body = await req.json(); } catch { body = {}; }
  } else if (!body && req.on && method !== "GET" && method !== "HEAD") {
    body = await new Promise((resolve) => {
      let data = "";
      req.on("data", (c: any) => { data += c; });
      req.on("end", () => {
        try { resolve(JSON.parse(data || "{}")); } catch { resolve({}); }
      });
      req.on("error", () => resolve({}));
    });
  }

  return { method, query, body: body || {}, getHeader };
}

// ─── Response helper ──────────────────────────────────────────────────────────
export function sendApiResponse(res: any, status: number, data: any, cacheControl?: string): any {
  if (res && typeof res.status === "function" && typeof res.setHeader === "function") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    if (cacheControl) res.setHeader("Cache-Control", cacheControl);
    return res.status(status).json(data);
  }
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...(cacheControl ? { "Cache-Control": cacheControl } : {}),
    },
  });
}

// ─── Auth validator ───────────────────────────────────────────────────────────
export const DEFAULT_ADMIN_KEY = "shreehari_admin_secure_2026";

export function validateAdminAuth(getHeader: (name: string) => string | undefined): boolean {
  const adminKey = process.env.ADMIN_API_KEY || DEFAULT_ADMIN_KEY;
  const auth = getHeader("authorization");
  if (auth) {
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (token === adminKey || token.startsWith("shk_token_")) return true;
  }
  const xKey = getHeader("x-admin-key");
  if (xKey && xKey.trim() === adminKey) return true;
  return false;
}
