// Supabase Edge Function: create-razorpay-subscription
// Creates a Razorpay subscription server-side (secret never reaches the browser)
// and tags it with the authenticated user_id so the webhook can extend access.
// Deploy WITH JWT verification ON.
//
// Secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_ID, RAZORPAY_TOTAL_COUNT?

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
function uidFromAuth(req: Request): string | null {
  const h = req.headers.get("Authorization") || "";
  const m = h.match(/^Bearer (.+)$/);
  if (!m) return null;
  try {
    let p = m[1].split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    while (p.length % 4) p += "=";
    return JSON.parse(atob(p)).sub || null;
  } catch (_) {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const planId = Deno.env.get("RAZORPAY_PLAN_ID");
    const totalCount = Number(Deno.env.get("RAZORPAY_TOTAL_COUNT") || "12");
    if (!keyId || !keySecret || !planId) {
      return json({ error: "Razorpay is not configured (set RAZORPAY_KEY_ID/SECRET/PLAN_ID)." }, 500);
    }

    const uid = uidFromAuth(req);
    if (!uid) return json({ error: "auth_required" }, 401);
    const { name } = await req.json().catch(() => ({}));

    // Duplicate guard: if this user already has active premium, don't create a
    // second (billable) Razorpay subscription — just hand back the existing
    // entitlement so the client can restore premium instead of opening checkout.
    const sbUrl = Deno.env.get("SUPABASE_URL");
    const sbService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (sbUrl && sbService) {
      try {
        const r = await fetch(
          `${sbUrl}/rest/v1/ginni_access?user_id=eq.${uid}&select=premium_until,subscription_id`,
          { headers: { apikey: sbService, Authorization: `Bearer ${sbService}` } },
        );
        if (r.ok) {
          const rows = await r.json().catch(() => []);
          const row = Array.isArray(rows) && rows.length ? rows[0] : null;
          const untilMs = row?.premium_until ? new Date(row.premium_until).getTime() : 0;
          if (untilMs > Date.now()) {
            return json({ already_active: true, premiumUntil: untilMs, subscription_id: row?.subscription_id ?? null });
          }
        }
      } catch (_) { /* non-fatal — fall through and create a fresh subscription */ }
    }

    const auth = "Basic " + btoa(`${keyId}:${keySecret}`);
    const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: planId,
        total_count: totalCount,
        quantity: 1,
        customer_notify: 1,
        notes: { user_id: uid, name: name || "" },
      }),
    });
    const data = await res.json();
    if (!res.ok) return json({ error: "Razorpay error", detail: data }, 502);
    return json({ subscription_id: data.id, key_id: keyId, status: data.status });
  } catch (err) {
    return json({ error: String(err) }, 400);
  }
});
