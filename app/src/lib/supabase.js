// Lazy Supabase client. Loaded only when configured, so the offline demo/preview
// never pulls in the SDK.
const URL_ = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(URL_ && ANON);

let _client = null;
export async function getSupabase() {
  if (!supabaseEnabled) return null;
  if (_client) return _client;
  const { createClient } = await import("@supabase/supabase-js");
  _client = createClient(URL_, ANON, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return _client;
}
