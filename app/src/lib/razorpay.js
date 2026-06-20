// Razorpay subscription checkout (frontend).
// Real checkout runs only when VITE_RAZORPAY_KEY_ID + a backend are configured.
// Otherwise returns { incubated:true } so the caller grants 30-day access
// directly — the app NEVER breaks if Razorpay isn't set up yet.

import { getDeviceId } from "./rateLimit";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const FN_BASE = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1`
  : (import.meta.env.VITE_FN_BASE || "");

export function razorpayConfigured() {
  return Boolean(KEY_ID && FN_BASE);
}

async function callFn(name, body) {
  const url = `${FN_BASE}/${name}`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(ANON ? { Authorization: `Bearer ${ANON}`, apikey: ANON } : {}),
    },
    body: JSON.stringify(body || {}),
  });
  if (!r.ok) throw new Error(`${name} ${r.status}: ${await r.text().catch(() => "")}`);
  return r.json();
}

let sdkPromise;
function loadCheckout() {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => reject(new Error("Razorpay SDK could not load"));
    document.body.appendChild(s);
  });
  return sdkPromise;
}

/**
 * @returns {Promise<{success?:boolean, premiumUntil?:number, incubated?:boolean, dismissed?:boolean}>}
 */
export async function startSubscription({ name } = {}) {
  if (!razorpayConfigured()) return { incubated: true };

  await loadCheckout();
  const deviceId = getDeviceId();
  const { subscription_id, key_id } = await callFn("create-razorpay-subscription", { name, deviceId });
  if (!subscription_id) throw new Error("Could not create subscription");

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: key_id || KEY_ID,
      subscription_id,
      name: "Ginni Ki Baatein",
      description: "Premium — 30 days full access",
      theme: { color: "#f5a623" },
      prefill: name ? { name } : {},
      handler: async (resp) => {
        try {
          const v = await callFn("verify-razorpay-payment", { ...resp, deviceId });
          if (v && v.valid) resolve({ success: true, premiumUntil: v.premiumUntil });
          else reject(new Error("Payment could not be verified"));
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => resolve({ dismissed: true }) },
    });
    rzp.on("payment.failed", (e) => reject(new Error(e?.error?.description || "Payment failed")));
    rzp.open();
  });
}
