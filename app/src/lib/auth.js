import { getSupabase, supabaseEnabled } from "./supabase";
export { supabaseEnabled };
export async function ensureSession() {
  const sb = await getSupabase(); if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (session) return session;
  try { const { data, error } = await sb.auth.signInAnonymously(); if (error) { console.warn("anon sign-in:", error.message); return null; } return data.session; }
  catch (e) { console.warn("anon sign-in failed:", e); return null; }
}
export async function getToken() {
  const sb = await getSupabase(); if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  return session?.access_token || null;
}
export async function currentEmail() {
  const sb = await getSupabase(); if (!sb) return "";
  const { data: { user } } = await sb.auth.getUser();
  return user?.email || "";
}
export async function sendEmailOtp(email) {
  const sb = await getSupabase(); if (!sb) throw new Error("Auth not configured");
  // emailRedirectTo makes any magic-link fallback return to THIS app (not the
  // Supabase default Site URL). For a 6-digit code, the email template must use
  // {{ .Token }} (see DEPLOY.md).
  const emailRedirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo } });
  if (error) throw error; return true;
}
export async function verifyEmailOtp(email, token) {
  const sb = await getSupabase(); if (!sb) throw new Error("Auth not configured");
  // new emails arrive as a "signup" OTP, returning ones as "email" — try both.
  let res = await sb.auth.verifyOtp({ email, token, type: "email" });
  if (res.error) res = await sb.auth.verifyOtp({ email, token, type: "signup" });
  if (res.error) throw res.error;
  return res.data.session;
}
export async function restoreEntitlement() {
  const sb = await getSupabase(); if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser(); if (!user) return null;
  const { data } = await sb.from("ginni_access").select("premium_until").eq("user_id", user.id).maybeSingle();
  return data?.premium_until ? new Date(data.premium_until).getTime() : null;
}
