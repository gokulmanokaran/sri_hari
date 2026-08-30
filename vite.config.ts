import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";


// ── Shared Local Dev API ─────────────────────────────────────────────────────
// Serves /api/products and /api/categories from data/catalog.json
// The admin panel writes to this same file → changes reflect immediately.
// ─────────────────────────────────────────────────────────────────────────────

const CATALOG_FILE = path.resolve(__dirname, "data/catalog.json");

function readCatalog(): { products: unknown[]; categories: unknown[] } {
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
    console.warn("[DevAPI] Could not read data/catalog.json:", e);
  }
  return { products: [], categories: [] };
}

function autoSeedIfEmpty(): void {
  const catalog = readCatalog();
  if (catalog.products.length > 0) return; // already seeded

  console.log("[DevAPI] catalog.json is empty — auto-seeding from _catalog.ts...");
  try {
    // Dynamically require the seed script
    const { execSync } = require("child_process");
    execSync("npx tsx scripts/seed-catalog.ts", {
      cwd: __dirname,
      stdio: "inherit",
    });
    console.log("[DevAPI] ✅ Auto-seed complete.");
  } catch (e) {
    console.warn("[DevAPI] Auto-seed failed:", e);
  }
}

function localDevApiPlugin(): Plugin {
  return {
    name: "sri-hari-local-dev-api",
    configureServer(server) {
      // Auto-seed on startup if catalog.json is missing/empty
      autoSeedIfEmpty();

      server.middlewares.use((req, res, next) => {
        const url = req.url || "";

        // GET /api/products
        if (url.startsWith("/api/products") && req.method === "GET") {
          const catalog = readCatalog();
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              success: true,
              count: catalog.products.length,
              data: catalog.products,
              source: "local-file",
            })
          );
          return;
        }

        // GET /api/categories
        if (url.startsWith("/api/categories") && req.method === "GET") {
          const catalog = readCatalog();
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.statusCode = 200;
          res.end(
            JSON.stringify({
              success: true,
              count: catalog.categories.length,
              data: catalog.categories,
              source: "local-file",
            })
          );
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localDevApiPlugin()],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: "es2020",
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router-dom/")
          ) {
            return "vendor-react";
          }
          if (id.includes("node_modules/framer-motion/")) {
            return "vendor-motion";
          }
          if (id.includes("node_modules/lucide-react/")) {
            return "vendor-icons";
          }
          if (id.includes("node_modules/@supabase/")) {
            return "vendor-supabase";
          }
        },
      },
    },

  },
});
