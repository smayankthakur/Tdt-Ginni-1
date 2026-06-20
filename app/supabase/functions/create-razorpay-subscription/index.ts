// Supabase Edge Function: create-razorpay-subscription
// Creates a Razorpay subscription server-side (the Key Secret never reaches the
// browser). Returns the subscription id + public Key ID for the checkout popup.
//
// Required secrets (set with: supabase secrets set KEY=value):
//   RAZORPAY_KEY_ID      - your Razorpay Key ID (rzp_live_... / rzp_test_...)
//   RAZORPAY_KEY_SECRET  - your Razorpay Key Secret  (KEEP PRIVATE)
//   RAZORPAY_PLAN_ID     - the Plan ID to subscribe to (plan_...)
//   RAZORPAY_TOTAL_COUNT - optional, billing cycles (default 12)

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    const planId = Deno.env.get("RAZORPAY_PLAN_ID");
    const totalCount = Number(Deno.env.get("RAZORPAY_TOTAL_COUNT") || "12");

    if (!keyId || !keySecret || !planId) {
      return json({ error: "Razorpay is not configured (set RAZORPAY_KEY_ID/SECRET/PLAN_ID)." }, 500);
    }

    const { deviceId } = await req.json().catch(() => ({}));

    const auth = "Basic " + btoa(`${keyId}:${keySecret}`);
    const res = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_id: planId,
        total_count: totalCount,
        quantity: 1,
        customer_notify: 1,
        notes: deviceId ? { device_id: deviceId } : undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) return json({ error: "Razorpay error", detail: data }, 502);

    return json({ subscription_id: data.id, key_id: keyId, status: data.status });
  } catch (err) {
    return json({ error: String(err) }, 400);
  }
});
