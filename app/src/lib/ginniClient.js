// Talks to the `tarot-chat` Supabase edge function (server-side LLM + persona +
// quota/subscription enforcement). Falls back to an offline demo reading when no
// backend is configured, so the UI is always runnable.

import { demoReading } from "./demoReading";
import { getDeviceId, todayLocal } from "./rateLimit";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FN_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/tarot-chat`
  : import.meta.env.VITE_TAROT_CHAT_URL || "";

export class DailyLimitError extends Error {
  constructor(info = {}) {
    super("daily_limit");
    this.code = "daily_limit";
    this.info = info;
  }
}

/**
 * @returns {Promise<{reading:string, premium?:boolean, premiumUntil?:number, remaining?:number}>}
 */
export async function generateReading(payload) {
  if (!FN_URL) {
    await new Promise((r) => setTimeout(r, 300));
    return { reading: demoReading(payload) };
  }

  let res;
  try {
    res = await fetch(FN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SUPABASE_ANON ? { Authorization: `Bearer ${SUPABASE_ANON}`, apikey: SUPABASE_ANON } : {}),
      },
      body: JSON.stringify({ ...payload, deviceId: getDeviceId(), localDate: todayLocal() }),
    });
  } catch (e) {
    // Network failure → graceful offline reading so the chat never breaks.
    return { reading: demoReading(payload), offline: true };
  }

  if (res.status === 429) {
    let info = {};
    try { info = await res.json(); } catch (_) {}
    throw new DailyLimitError(info);
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`tarot-chat ${res.status}: ${msg}`);
  }

  const data = await res.json().catch(() => ({}));
  return {
    reading: data.reading || data.text || data.message || "",
    premium: data.premium,
    premiumUntil: data.premiumUntil,
    remaining: data.remaining,
  };
}
