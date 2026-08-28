// Vercel Serverless Function: /api/categories
// Central Categories API for Website, Separate Admin Panel, and Future Android App.
import {
  Category,
  getCloudCategories,
  saveCloudCategories,
  validateAdminAuth,
  corsHeaders,
} from "./_catalog";

export default async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders(),
    });
  }

  // ── GET: Public Read Categories ───────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const categories = await getCloudCategories();
      return new Response(
        JSON.stringify({
          success: true,
          count: categories.length,
          data: categories,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders(),
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
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

  // ── Protected Admin Write Methods (POST, PUT) ─────────────────────────────
  if (!validateAdminAuth(req)) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized. Valid Admin credentials required." }),
      { status: 401, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  }

  if (req.method === "POST" || req.method === "PUT") {
    try {
      const body = await req.json();

      if (Array.isArray(body)) {
        await saveCloudCategories(body);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Successfully synchronized ${body.length} categories.`,
            count: body.length,
            data: body,
          }),
          { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
        );
      }

      const newCat: Category = {
        id: body.id || `cat_${Date.now()}`,
        name: body.name || "Untitled Category",
        emoji: body.emoji || "📦",
        description: body.description || "",
        color: body.color || "#F5F5F5",
        sortOrder: body.sortOrder || 99,
        active: body.active !== false,
      };

      const existing = await getCloudCategories();
      const idx = existing.findIndex((c) => c.id === newCat.id);

      let updatedList: Category[];
      if (idx >= 0) {
        updatedList = [...existing];
        updatedList[idx] = newCat;
      } else {
        updatedList = [...existing, newCat];
      }

      await saveCloudCategories(updatedList);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Category saved successfully.",
          data: newCat,
        }),
        { status: 200, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Error saving category" }),
        { status: 400, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { ...corsHeaders(), "Content-Type": "application/json" },
  });
}
