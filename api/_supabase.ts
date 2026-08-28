import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabaseServerClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (_supabaseServerClient) return _supabaseServerClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (url && key) {
    try {
      _supabaseServerClient = createClient(url, key, {
        auth: { persistSession: false },
      });
      return _supabaseServerClient;
    } catch (err) {
      console.warn("[Supabase Server] Initialization error:", err);
    }
  }

  return null;
}
