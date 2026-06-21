// Server-side reading gate (per authenticated user). Returns the authoritative
// quota/premium decision. Fails OPEN to local gating if the backend is absent or
// errors, so the chat never hard-breaks.
import { supabaseEnabled } from "./supabase";
import { getToken } from "./auth";

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FN = URL_ ? `${URL_.replace(/\/$/, "")}/functions/v1/reading-gate` : "";

/**
 * @returns {Promise<{allowed?:boolean, premium?:boolean, premiumUntil?:number,
 *   remaining?:number, unconfigured?:boolean, error?:string}>}
 */
export async function gateReading(localDate) {
  if (!FN || !supabaseEnabled) return { unconfigured: true };
  try {
    const token = await getToken();
    const res = await fetch(FN, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: ANON, Authorization: `Bearer ${token || ANON}` },
      body: JSON.stringify({ localDate }),
    });
    if (res.status === 429) {
      let info = {};
      try { info = await res.json(); } catch (_) {}
      return { allowed: false, ...info };
    }
    if (!res.ok) return { unconfigured: true, error: `gate ${res.status}` };
    const data = await res.json();
    if (data.unconfigured) return { unconfigured: true };
    return data;
  } catch (e) {
    return { unconfigured: true, error: String(e) };
  }
}
