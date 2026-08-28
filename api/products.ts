// Vercel Serverless Function: /api/products
// Central Product API for Website, Separate Admin Panel, and Future Android App.
import {
  Product,
  getCloudProducts,
  saveCloudProducts,
  validateAdminAuth,
  corsHeaders,
  getLastCatalogUpdate,
} from "./_catalog";

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(),
    });
  }

  const url = new URL(req.url);
  const productId = url.searchParams.get("id");
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");
  const inStockOnly = url.searchParams.get("inStock") === "true";

  // ── GET: Public Read Products ──────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      let products = await getCloudProducts();

      // Single Product Lookup by ID
      if (productId) {
        const found = products.find(
          (p) => p.id === productId || p.variants?.some((v) => v.id === productId)
        );
        if (!found) {
          return new Response(
            JSON.stringify({ success: false, error: "Product not found", id: productId }),
            { status: 404, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ success: true, data: found }),
          {
            status: 200,
            headers: {
              ...corsHeaders(),
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=86400",
            },
          }
        );
      }

      // Filter by Category
      if (category && category !== "all") {
        products = products.filter((p) => p.category === category);
      }

      // Filter by Stock Status
      if (inStockOnly) {
        products = products.filter((p) => p.inStock === true);
      }

      // Filter by Search query
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.nameTamil && p.nameTamil.toLowerCase().includes(q)) ||
            (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
            p.category.toLowerCase().includes(q) ||
            p.unit.toLowerCase().includes(q)
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          count: products.length,
          lastUpdated: getLastCatalogUpdate(),
          data: products,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders(),
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=86400",
          },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Internal Error" }),
        { status: 500, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }
  }

  // ── Protected Admin Write Methods (POST, PUT, DELETE) ──────────────────────
  if (!validateAdminAuth(req)) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized. Valid Admin credentials required." }),
      { status: 401, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  // ── POST: Create New Product / Bulk Update ─────────────────────────────────
  if (req.method === "POST") {
    try {
      const body = await req.json();

      // Bulk Sync / Save All Products
      if (Array.isArray(body)) {
        await saveCloudProducts(body);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Successfully synchronized ${body.length} products to Central API.`,
            count: body.length,
            lastUpdated: getLastCatalogUpdate(),
          }),
          { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
      }

      // Single Product Creation
      const newProduct: Product = {
        ...body,
        id: body.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: body.name || "Untitled Product",
        nameTamil: body.nameTamil || body.tamilName || "",
        tamilName: body.tamilName || body.nameTamil || "",
        price: Number(body.price) || 0,
        mrp: Number(body.mrp) || Number(body.price) || 0,
        unit: body.unit || "1 Pack",
        category: body.category || "keerai",
        inStock: body.inStock !== false,
        active: body.active !== false,
        updatedAt: new Date().toISOString(),
      };

      const existingProducts = await getCloudProducts();
      const existingIdx = existingProducts.findIndex((p) => p.id === newProduct.id);

      let updatedList: Product[];
      if (existingIdx >= 0) {
        updatedList = [...existingProducts];
        updatedList[existingIdx] = newProduct;
      } else {
        updatedList = [newProduct, ...existingProducts];
      }

      await saveCloudProducts(updatedList);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Product created/saved successfully.",
          data: newProduct,
          lastUpdated: getLastCatalogUpdate(),
        }),
        { status: 201, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Error creating product" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }
  }

  // ── PUT: Update Existing Product ───────────────────────────────────────────
  if (req.method === "PUT" || req.method === "PATCH") {
    try {
      const updateData = await req.json();
      const targetId = updateData.id || productId;

      if (!targetId) {
        return new Response(
          JSON.stringify({ success: false, error: "Product ID is required for update." }),
          { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
      }

      const existingProducts = await getCloudProducts();
      const index = existingProducts.findIndex((p) => p.id === targetId);

      if (index === -1) {
        return new Response(
          JSON.stringify({ success: false, error: `Product with ID ${targetId} not found.` }),
          { status: 404, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
      }

      const current = existingProducts[index];
      const updatedProduct: Product = {
        ...current,
        ...updateData,
        id: current.id, // preserve ID
        nameTamil: updateData.nameTamil !== undefined ? updateData.nameTamil : (updateData.tamilName !== undefined ? updateData.tamilName : current.nameTamil),
        tamilName: updateData.tamilName !== undefined ? updateData.tamilName : (updateData.nameTamil !== undefined ? updateData.nameTamil : current.tamilName),
        price: updateData.price !== undefined ? Number(updateData.price) : current.price,
        inStock: updateData.inStock !== undefined ? Boolean(updateData.inStock) : current.inStock,
        updatedAt: new Date().toISOString(),
      };

      const updatedList = [...existingProducts];
      updatedList[index] = updatedProduct;

      await saveCloudProducts(updatedList);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Product ${updatedProduct.name} (#${updatedProduct.id}) updated successfully.`,
          data: updatedProduct,
          lastUpdated: getLastCatalogUpdate(),
        }),
        { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Error updating product" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }
  }

  // ── DELETE: Remove / Deactivate Product ────────────────────────────────────
  if (req.method === "DELETE") {
    try {
      const body = await req.json().catch(() => ({}));
      const targetId = productId || body.id;

      if (!targetId) {
        return new Response(
          JSON.stringify({ success: false, error: "Product ID is required for deletion." }),
          { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
      }

      const existingProducts = await getCloudProducts();
      const filtered = existingProducts.filter((p) => p.id !== targetId);

      if (filtered.length === existingProducts.length) {
        return new Response(
          JSON.stringify({ success: false, error: `Product with ID ${targetId} not found.` }),
          { status: 404, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
      }

      await saveCloudProducts(filtered);

      return new Response(
        JSON.stringify({
          success: true,
          message: `Product #${targetId} successfully removed.`,
          remainingCount: filtered.length,
          lastUpdated: getLastCatalogUpdate(),
        }),
        { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Error deleting product" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}
