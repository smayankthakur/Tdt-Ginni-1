// Supabase Edge Function: reading-gate
// Server-side quota / subscription gate keyed on the AUTHENTICATED user.
// The client calls this before revealing a reading; it returns whether the user
// is allowed (premium = unlimited; free = DAILY_LIMIT/day) and the live counters.
// Deploy WITH JWT verification ON (default).

const DAILY_LIMIT = Number(Deno.env.get("DAILY_LIMIT") || "3");
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const SB_URL = Deno.env.get("SUPABASE_URL");
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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
    const json = JSON.parse(atob(p));
    return json.sub || null;
  } catch (_) {
    return null;
  }
}
async function sbGet(userId: string) {
  const url = `${SB_URL}/rest/v1/ginni_access?user_id=eq.${userId}&select=*`;
  const r = await fetch(url, { headers: { apikey: SB_SERVICE!, Authorization: `Bearer ${SB_SERVICE}` } });
  if (!r.ok) return null;
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}
async function sbUpsert(row: Record<string, unknown>) {
  await fetch(`${SB_URL}/rest/v1/ginni_access?on_conflict=user_id`, {
    method: "POST",
    headers: {
      apikey: SB_SERVICE!, Authorization: `Bearer ${SB_SERVICE}`,
      "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([{ ...row, updated_at: new Date().toISOString() }]),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    if (!SB_URL || !SB_SERVICE) return json({ allowed: true, unconfigured: true }); // no backend → client falls back
    const uid = uidFromAuth(req);
    if (!uid) return json({ error: "auth_required" }, 401);

    const body = await req.json().catch(() => ({}));
    const localDate = body.localDate || new Date().toISOString().slice(0, 10);

    const row = await sbGet(uid);
    let premium = false, premiumUntilMs: number | null = null;
    if (row?.premium_until) {
      premiumUntilMs = new Date(row.premium_until).getTime();
      premium = premiumUntilMs > Date.now();
    }
    if (premium) return json({ allowed: true, premium: true, premiumUntil: premiumUntilMs, remaining: null });

    const used = row && row.daily_date === localDate ? Number(row.daily_count || 0) : 0;
    if (used >= DAILY_LIMIT) {
      return json({ allowed: false, error: "daily_limit", premium: false, premiumUntil: premiumUntilMs, remaining: 0 }, 429);
    }
    const newCount = used + 1;
    await sbUpsert({ user_id: uid, daily_date: localDate, daily_count: newCount, premium_until: row?.premium_until ?? null });
    return json({ allowed: true, premium: false, premiumUntil: premiumUntilMs, remaining: Math.max(0, DAILY_LIMIT - newCount) });
  } catch (err) {
    return json({ error: String(err) }, 400);
  }
});
