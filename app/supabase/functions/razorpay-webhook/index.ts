// Supabase Edge Function: razorpay-webhook
// Receives Razorpay subscription webhooks, verifies the signature, and extends
// the user's access (premium_until) on every successful charge — so renewals
// keep Premium active automatically.
//
// Deploy WITHOUT JWT verification (Razorpay can't send a Supabase JWT):
//   supabase functions deploy razorpay-webhook --no-verify-jwt
// In the Razorpay Dashboard, add a Webhook to .../functions/v1/razorpay-webhook
// for events: subscription.charged, subscription.activated, subscription.cancelled.
// Env: RAZORPAY_WEBHOOK_SECRET (the webhook's secret you set in Razorpay),
//      SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (auto).

const SB_URL = Deno.env.get("SUPABASE_URL");
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const DAY_MS = 24 * 60 * 60 * 1000;

function toHex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hmacHex(secret: string, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
}
async function setPremium(userId: string, untilMs: number, subId?: string) {
  if (!SB_URL || !SB_SERVICE || !userId) return;
  await fetch(`${SB_URL}/rest/v1/ginni_access?on_conflict=user_id`, {
    method: "POST",
    headers: { apikey: SB_SERVICE, Authorization: `Bearer ${SB_SERVICE}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([{ user_id: userId, premium_until: new Date(untilMs).toISOString(), subscription_id: subId, updated_at: new Date().toISOString() }]),
  });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  try {
    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!secret) return new Response("not configured", { status: 500 });

    const raw = await req.text();
    const sig = req.headers.get("x-razorpay-signature") || "";
    const expected = await hmacHex(secret, raw);
    if (expected !== sig) return new Response("invalid signature", { status: 401 });

    const event = JSON.parse(raw);
    const sub = event?.payload?.subscription?.entity;
    const type = event?.event || "";

    if (sub && /subscription\.(charged|activated|authenticated|resumed|updated)/.test(type)) {
      const userId = sub.notes?.user_id;
      const end = (sub.current_end || sub.charge_at || sub.end_at);
      const untilMs = end ? end * 1000 : Date.now() + 30 * DAY_MS;
      if (userId) await setPremium(userId, untilMs, sub.id);
    }
    // subscription.cancelled/completed/halted → let access lapse at premium_until (no change needed)

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
});
