// Supabase Edge Function: tarot-chat
// Holds Ginni's persona + reading format server-side, asks an LLM to interpret
// the drawn cards, and ENFORCES the daily quota + 30-day subscription server-side
// (the client can't bypass it via localStorage).
//
// Env:
//   LOVABLE_API_KEY / OPENAI_API_KEY  - LLM provider (one required)
//   TAROT_MODEL                        - optional model id
//   DAILY_LIMIT                        - free readings/day (default 3)
//   ALLOWED_ORIGIN                     - CORS origin (default *)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY - auto-provided; enables enforcement
//
// Deploy WITH JWT verification (do NOT pass --no-verify-jwt) so only callers with
// your anon key reach it:  supabase functions deploy tarot-chat

const DAILY_LIMIT = Number(Deno.env.get("DAILY_LIMIT") || "3");
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const SB_URL = Deno.env.get("SUPABASE_URL");
const SB_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ENFORCE = Boolean(SB_URL && SB_SERVICE);

const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

const SYSTEM_PROMPT = `You are Ginni — an exclusive, members-only private tarot counsel. You give refined, elegant tarot readings in HINGLISH (Roman-script Hindi blended naturally with English), as a warm, graceful, feminine guide.

VOICE & TONE
- Warm, intimate, reassuring, and dignified. Never crude, never alarmist.
- Address the querent by their name often, weaving it into sentences.
- Use elegant Hinglish: English scaffolding with natural Hindi phrases in Roman script.
- Reframe difficult or "negative" cards constructively — as guidance and growth, never doom.
- A tasteful emoji here and there (🌌 ✨) is welcome; do not overuse.

INPUT
You receive the querent's name, their question, the spread's position labels, and the drawn cards. All cards are drawn UPRIGHT — never interpret a card as reversed. Interpret THOSE specific cards in THOSE positions — do not invent different cards.

OUTPUT FORMAT (plain text, exactly this structure; no markdown bullets, no preamble)
1. An opening acknowledgement: one short paragraph. Greet by name, show empathy in Hinglish, and frame the question.
2. A line containing only: The Revelations
3. One paragraph per drawn card, each beginning with "<Position>: <Card Name>", then a 3-4 sentence Hinglish interpretation that ties the card to the question and repeats the querent's name.
4. A paragraph beginning with "Universe ka guidance " that synthesises the cards into clear, actionable guidance.
5. A final one-line closing blessing ending with ✨.

SPECIAL CASES
- "Yes / No" questions: still follow the structure, but make the leaning (haan / nahi / abhi intezaar) clear in the Universe ka guidance.
- Keep the whole reading graceful and not overly long.
- Output ONLY the reading text using the exact headings above.`;

function buildUserPrompt({ name, question, positions, cards }: any) {
  const drawn = (cards || [])
    .map((c: any, i: number) => `  ${positions?.[i] ?? `Card ${i + 1}`}: ${c.name} (upright)`)
    .join("\n");
  return `Querent name: ${name}
Question: ${question}
Spread positions: ${(positions || []).join(" · ")}
Drawn cards:
${drawn}

Give the reading now, following the required format exactly.`;
}

// --- Supabase access (service role; bypasses RLS) --------------------------
async function sbGet(deviceId: string) {
  const url = `${SB_URL}/rest/v1/ginni_access?device_id=eq.${encodeURIComponent(deviceId)}&select=*`;
  const r = await fetch(url, {
    headers: { apikey: SB_SERVICE!, Authorization: `Bearer ${SB_SERVICE}` },
  });
  if (!r.ok) return null;
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}
async function sbUpsert(row: Record<string, unknown>) {
  const url = `${SB_URL}/rest/v1/ginni_access?on_conflict=device_id`;
  await fetch(url, {
    method: "POST",
    headers: {
      apikey: SB_SERVICE!,
      Authorization: `Bearer ${SB_SERVICE}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify([{ ...row, updated_at: new Date().toISOString() }]),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

  try {
    const payload = await req.json();
    const deviceId: string | undefined = payload.deviceId;
    const localDate: string = payload.localDate || new Date().toISOString().slice(0, 10);

    // ---- enforce quota / subscription (authoritative) --------------------
    let premium = false;
    let premiumUntilMs: number | null = null;
    let usedCount = 0;
    let row: any = null;

    if (ENFORCE) {
      if (!deviceId) return json({ error: "deviceId required" }, 400);
      row = await sbGet(deviceId);
      if (row?.premium_until) {
        premiumUntilMs = new Date(row.premium_until).getTime();
        premium = premiumUntilMs > Date.now();
      }
      if (!premium) {
        usedCount = row && row.daily_date === localDate ? Number(row.daily_count || 0) : 0;
        if (usedCount >= DAILY_LIMIT) {
          return json({ error: "daily_limit", remaining: 0, premium: false, premiumUntil: premiumUntilMs }, 429);
        }
      }
    }

    // ---- LLM -------------------------------------------------------------
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const useLovable = Boolean(lovableKey);
    const endpoint = useLovable
      ? "https://ai.gateway.lovable.dev/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const apiKey = useLovable ? lovableKey : openaiKey;
    const model = Deno.env.get("TAROT_MODEL") || (useLovable ? "google/gemini-2.5-flash" : "gpt-4o-mini");
    if (!apiKey) return json({ error: "No LLM key configured." }, 500);

    const llmRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(payload) },
        ],
      }),
    });
    if (!llmRes.ok) {
      const detail = await llmRes.text();
      return json({ error: "LLM error", detail }, 502);
    }
    const data = await llmRes.json();
    const reading = data.choices?.[0]?.message?.content?.trim() ?? "";

    // ---- record usage ----------------------------------------------------
    let remaining: number | null = null;
    if (ENFORCE && !premium) {
      const newCount = usedCount + 1;
      await sbUpsert({
        device_id: deviceId,
        daily_date: localDate,
        daily_count: newCount,
        premium_until: row?.premium_until ?? null,
      });
      remaining = Math.max(0, DAILY_LIMIT - newCount);
    }

    return json({ reading, premium, premiumUntil: premiumUntilMs, remaining });
  } catch (err) {
    return json({ error: String(err) }, 400);
  }
});
