import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

// ─────────────────────────────────────────────────────────────────────────────
// Shared catalog file — written by admin panel, read by main website
// Path: c:\sri_hari\data\catalog.json
// ─────────────────────────────────────────────────────────────────────────────
const CATALOG_FILE = path.resolve(__dirname, "../data/catalog.json");

function readCatalogFile(): { products: unknown[]; categories: unknown[] } {
  try {
    if (fs.existsSync(CATALOG_FILE)) {
      const raw = fs.readFileSync(CATALOG_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        products: Array.isArray(parsed.products) ? parsed.products : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      };
    }
  } catch (e) {
    console.warn("[AdminDevAPI] Could not read catalog.json:", e);
  }
  return { products: [], categories: [] };
}

function writeCatalogFile(data: { products?: unknown[]; categories?: unknown[] }): void {
  try {
    const existing = readCatalogFile();
    const merged = {
      products: data.products ?? existing.products,
      categories: data.categories ?? existing.categories,
      updatedAt: new Date().toISOString(),
    };
    const dir = path.dirname(CATALOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(merged, null, 2), "utf-8");
    console.log(`[AdminDevAPI] catalog.json updated — ${merged.products.length} products`);
  } catch (e) {
    console.warn("[AdminDevAPI] Could not write catalog.json:", e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Panel Vite Dev API Plugin
// ─────────────────────────────────────────────────────────────────────────────
function devApiPlugin(): Plugin {
  // Images: prefer local copy in admin-panel/public/, fallback to parent project
  const localImagesDir = path.resolve(__dirname, "public/product-images");
  const parentImagesDir = path.resolve(__dirname, "../public/product-images");

  const MIME: Record<string, string> = {
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
  };

  return {
    name: "admin-dev-api-middleware",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || "";

        // ── 1. Product Images ────────────────────────────────────────────────
        if (url.startsWith("/product-images/")) {
          const decoded = decodeURIComponent(url.replace("/product-images/", "").split("?")[0]);
          const localPath = path.join(localImagesDir, decoded);
          const parentPath = path.join(parentImagesDir, decoded);
          const filePath = fs.existsSync(localPath) ? localPath : fs.existsSync(parentPath) ? parentPath : null;

          if (filePath) {
            const ext = path.extname(filePath).toLowerCase();
            res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
            res.setHeader("Cache-Control", "public, max-age=86400");
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }

        // ── 2. Admin Authentication ──────────────────────────────────────────
        if (url.startsWith("/api/admin/auth") && req.method === "POST") {
          let bodyStr = "";
          req.on("data", (chunk) => { bodyStr += chunk; });
          req.on("end", () => {
            res.setHeader("Content-Type", "application/json");
            try {
              const body = JSON.parse(bodyStr || "{}");
              const pin = (body.pin || body.password || "").toString().trim().toLowerCase();
              const valid = ["2026", "2026b", "admin2026", "shreehari2026", "shreehari_admin_secure_2026"].includes(pin);
              if (valid) {
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, token: "shk_token_admin_2026", role: "admin", storeName: "Shree Hari Keerai", issuedAt: new Date().toISOString() }));
              } else {
                res.statusCode = 401;
                res.end(JSON.stringify({ success: false, error: "Invalid Administrator PIN. (Default PIN: 2026)" }));
              }
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: "Invalid request payload" }));
            }
          });
          return;
        }

        // ── 3. Products bulk-seed (first-time initialization) ───────────────
        if (url === "/api/products/bulk-seed" && req.method === "POST") {
          res.setHeader("Content-Type", "application/json");
          let bodyStr = "";
          req.on("data", (chunk) => { bodyStr += chunk; });
          req.on("end", () => {
            try {
              const body = JSON.parse(bodyStr || "{}");
              if (Array.isArray(body.products) && body.products.length > 0) {
                writeCatalogFile({ products: body.products });
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, count: body.products.length, message: "Catalog seeded" }));
              } else {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: "No products in payload" }));
              }
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: "Invalid payload" }));
            }
          });
          return;
        }

        // ── 4. Products API ──────────────────────────────────────────────────
        if (url.startsWith("/api/products")) {
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");

          if (req.method === "GET") {
            const catalog = readCatalogFile();
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, count: catalog.products.length, data: catalog.products, source: "local-file" }));
            return;
          }

          let bodyStr = "";
          req.on("data", (chunk) => { bodyStr += chunk; });
          req.on("end", () => {
            try {
              const body = JSON.parse(bodyStr || "{}");

              if (req.method === "POST") {
                // Add new product
                const catalog = readCatalogFile();
                const existing = catalog.products as Array<{ id: string }>;
                const newProduct = { ...body, id: body.id || `prod_${Date.now().toString(36)}`, updatedAt: new Date().toISOString() };
                const updated = [newProduct, ...existing.filter((p) => p.id !== newProduct.id)];
                writeCatalogFile({ products: updated });
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, data: newProduct }));

              } else if (req.method === "PUT") {
                // Update / toggle product
                const catalog = readCatalogFile();
                const existing = catalog.products as Array<{ id: string }>;
                const updated = existing.map((p) =>
                  p.id === body.id ? { ...p, ...body, updatedAt: new Date().toISOString() } : p
                );
                writeCatalogFile({ products: updated });
                const saved = updated.find((p) => p.id === body.id) || body;
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, data: saved }));

              } else if (req.method === "DELETE") {
                // Delete product
                const catalog = readCatalogFile();
                const existing = catalog.products as Array<{ id: string }>;
                const filtered = existing.filter((p) => p.id !== body.id);
                writeCatalogFile({ products: filtered });
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, message: "Deleted", id: body.id }));

              } else {
                res.statusCode = 405;
                res.end(JSON.stringify({ success: false, error: "Method not allowed" }));
              }
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: "Invalid payload" }));
            }
          });
          return;
        }

        // ── 4. Categories API ────────────────────────────────────────────────
        if (url.startsWith("/api/categories")) {
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");

          if (req.method === "GET") {
            const catalog = readCatalogFile();
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, count: catalog.categories.length, data: catalog.categories, source: "local-file" }));
            return;
          }

          let bodyStr = "";
          req.on("data", (chunk) => { bodyStr += chunk; });
          req.on("end", () => {
            try {
              const body = JSON.parse(bodyStr || "{}");
              const catalog = readCatalogFile();
              const existing = catalog.categories as Array<{ id: string }>;
              const newCat = { ...body, updatedAt: new Date().toISOString() };
              const updated = [...existing.filter((c) => c.id !== newCat.id), newCat];
              writeCatalogFile({ categories: updated });
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, data: newCat }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: "Invalid payload" }));
            }
          });
          return;
        }

        // ── 5. Image Upload ──────────────────────────────────────────────────
        if (url.startsWith("/api/admin/upload-image") && req.method === "POST") {
          let bodyStr = "";
          req.on("data", (chunk) => { bodyStr += chunk; });
          req.on("end", () => {
            res.setHeader("Content-Type", "application/json");
            try {
              const body = JSON.parse(bodyStr || "{}");
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, imageUrl: body.image || "/favicon.svg", verified: true, message: "Image updated." }));
            } catch {
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: "Invalid upload payload" }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApiPlugin()],
  server: {
    port: 5174,
  },
});
