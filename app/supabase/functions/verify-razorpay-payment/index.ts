// Supabase Edge Function: verify-razorpay-payment
// Verifies the Razorpay subscription payment signature, then stores the premium
// window for the device (aligned to the subscription's real billing end when
// available, else +30 days). Returns premiumUntil (epoch ms) for the client.
//
// Signature = HMAC_SHA256(razorpay_payment_id + "|" + razorpay_subscription_id, KEY_SECRET).
// Env: RAZORPAY_KEY_SECRET (required), RAZORPAY_KEY_ID (to look up current_end),
//      ALLOWED_ORIGIN, SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY (to persist access).

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

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
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
    const end = d.current_end || d.charge_at || d.end_at; // unix seconds
    return end ? end * 1000 : null;
  } catch (_) {
    return null;
  }
}

async function persist(deviceId: string, premiumUntilMs: number) {
  if (!SB_URL || !SB_SERVICE || !deviceId) return;
  await fetch(`${SB_URL}/rest/v1/ginni_access?on_conflict=device_id`, {
    method: "POST",
    headers: {
      apikey: SB_SERVICE,
      Authorization: `Bearer ${SB_SERVICE}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([
      { device_id: deviceId, premium_until: new Date(premiumUntilMs).toISOString(), updated_at: new Date().toISOString() },
    ]),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!secret) return json({ valid: false, error: "RAZORPAY_KEY_SECRET not set" }, 500);

    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, deviceId } = await req.json();
    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return json({ valid: false, error: "Missing payment fields" }, 400);
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    );
    const valid = toHex(sigBuf) === razorpay_signature;
    if (!valid) return json({ valid: false });

    // Align access to the real billing cycle when possible; else 30 days.
    const end = (await subscriptionEndMs(razorpay_subscription_id)) || Date.now() + 30 * DAY_MS;
    if (deviceId) await persist(deviceId, end);

    return json({ valid: true, premiumUntil: end });
  } catch (err) {
    return json({ valid: false, error: String(err) }, 400);
  }
});
