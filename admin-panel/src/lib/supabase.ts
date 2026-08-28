import { createClient, SupabaseClient } from "@supabase/supabase-js";

const CUSTOM_URL_KEY = "shk_custom_supabase_url";
const CUSTOM_KEY_KEY = "shk_custom_supabase_key";

let _adminSupabaseClient: SupabaseClient | null = null;

export function getAdminSupabaseConfig(): { url: string; key: string } {
  let url = "";
  let key = "";

  try {
    url = localStorage.getItem(CUSTOM_URL_KEY) || "";
    key = localStorage.getItem(CUSTOM_KEY_KEY) || "";
  } catch {
    // ignore
  }

  if (!url) {
    url = import.meta.env.VITE_SUPABASE_URL || "";
  }
  if (!key) {
    key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  }

  return { url: url.trim(), key: key.trim() };
}

export function setCustomAdminSupabaseConfig(url: string | null, key: string | null): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(CUSTOM_URL_KEY, url.trim().replace(/\/+$/, ""));
    } else {
      localStorage.removeItem(CUSTOM_URL_KEY);
    }

    if (key && key.trim()) {
      localStorage.setItem(CUSTOM_KEY_KEY, key.trim());
    } else {
      localStorage.removeItem(CUSTOM_KEY_KEY);
    }
  } catch {
    // ignore
  }
  _adminSupabaseClient = null; // force re-initialization
}

export function getAdminSupabaseClient(): SupabaseClient | null {
  if (_adminSupabaseClient) return _adminSupabaseClient;

  const { url, key } = getAdminSupabaseConfig();

  if (url && key) {
    try {
      _adminSupabaseClient = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return _adminSupabaseClient;
    } catch (err) {
      console.warn("[AdminSupabase] Failed to initialize Supabase client:", err);
    }
  }

  return null;
}
