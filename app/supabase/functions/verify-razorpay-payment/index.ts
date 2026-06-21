// Supabase Edge Function: verify-razorpay-payment
// Verifies the Razorpay subscription payment signature, then stores the access
// window for the AUTHENTICATED user (so it persists across devices after login).
// Deploy WITH JWT verification ON.
//
// Secrets: RAZORPAY_KEY_SECRET (required), RAZORPAY_KEY_ID (to read current_end),
//          SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (auto).

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const SB_URL = Deno.env.get("SUPABASE_URL");
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const DAY_MS = 24 * 60 * 60 * 1000;

const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
function uidFromAuth(req: Request): string | null {
  const h = req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer (.+)$/);
  if (!m) return null;
  try {
    let p = m[1].split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    while (p.length % 4) p += "=";
    return JSON.parse(atob(p)).sub || null;
  } catch (_) { return null; }
}
async function subscriptionEndMs(subId: string): Promise<number | null> {
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !secret) return null;
  try {
    const r = await fetch(`https://api.razorpay.com/v1/subscriptions/${subId}`, {
      headers: { Authorization: "Basic " + btoa(`${keyId}:${secret}`) },
    });
    if (!r.ok) return null;
    const d = await r.json();
    const end = d.current_end || d.charge_at || d.end_at;
    return end ? end * 1000 : null;
  } catch (_) { return null; }
}
async function persist(userId: string, untilMs: number, subId: string): Promise<boolean> {
  if (!SB_URL || !SB_SERVICE || !userId) return false;
  const r = await fetch(`${SB_URL}/rest/v1/ginni_access?on_conflict=user_id`, {
    method: "POST",
    headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ user_id: userId, premium_until: new Date(untilMs).toISOString(), subscription_id: subId, updated_at: new Date().toISOString() }]),
  });
  if (!r.ok) {
    // Payment is valid but the entitlement write failed — surface it instead of
    // silently returning success (the webhook is the backstop for renewals).
    console.error("verify-razorpay-payment: persist failed", r.status, await r.text().catch(() => ""));
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!secret) return json({ valid: false, error: "RAZORPAY_KEY_SECRET not set" }, 500);
    const uid = uidFromAuth(req);
    if (!uid) return json({ valid: false, error: "auth_required" }, 401);

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = await req.json();
    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return json({ valid: false, error: "Missing payment fields" }, 400);
    }
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${razorpay_payment_id}|${razorpay_subscription_id}`)));
    if (sig !== razorpay_signature) return json({ valid: false });

    const end = (await subscriptionEndMs(razorpay_subscription_id)) || Date.now() + 30 * DAY_MS;
    const persisted = await persist(uid, end, razorpay_subscription_id);
    return json({ valid: true, premiumUntil: end, persisted });
  } catch (err) {
    return json({ valid: false, error: String(err) }, 400);
  }
});
