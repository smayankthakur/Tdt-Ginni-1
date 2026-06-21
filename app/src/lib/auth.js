// Supabase Auth helpers. Anonymous session by default (zero friction); optional
// email-OTP sign-in so a paying user can restore Premium on any device.
import { getSupabase, supabaseEnabled } from "./supabase";

export { supabaseEnabled };

// Ensure there is a session (anonymous if needed). Returns the session or null.
export async function ensureSession() {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  if (session) return session;
  try {
    const { data, error } = await sb.auth.signInAnonymously();
    if (error) { console.warn("anon sign-in:", error.message); return null; }
    return data.session;
  } catch (e) {
    console.warn("anon sign-in failed:", e);
    return null;
  }
}

export async function getToken() {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data: { session } } = await sb.auth.getSession();
  return session?.access_token || null;
}

export async function currentEmail() {
  const sb = await getSupabase();
  if (!sb) return "";
  const { data: { user } } = await sb.auth.getUser();
  return user?.email || "";
}

// Send a 6-digit / magic-link OTP to the email.
export async function sendEmailOtp(email) {
  const sb = await getSupabase();
  if (!sb) throw new Error("Auth not configured");
  const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
  return true;
}
// Verify the emailed code → upgrades/loads the account.
export async function verifyEmailOtp(email, token) {
  const sb = await getSupabase();
  if (!sb) throw new Error("Auth not configured");
  const { data, error } = await sb.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw error;
  return data.session;
}

// Read the user's own entitlement row to restore Premium across devices.
export async function restoreEntitlement() {
  const sb = await getSupabase();
  if (!sb) return null;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("ginni_access").select("premium_until").eq("user_id", user.id).maybeSingle();
  return data?.premium_until ? new Date(data.premium_until).getTime() : null;
}
