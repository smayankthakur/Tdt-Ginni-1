// Daily quota + subscription access (client mirror).
// The SERVER (tarot-chat / verify-razorpay-payment) is authoritative when a
// backend is configured; these helpers drive the UI and act as the offline
// fallback when there is no backend.

const FREE_DAILY_LIMIT = 3;
const PREMIUM_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

// Local calendar date (so the daily reset happens at the user's midnight).
export function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDeviceId() {
  let id = localStorage.getItem("ginni_device_id");
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("ginni_device_id", id);
  }
  return id;
}

export function getName() {
  return localStorage.getItem("ginni_name") || "";
}
export function setName(name) {
  localStorage.setItem("ginni_name", name);
}

function readCount() {
  if (localStorage.getItem("ginni_msg_date") !== todayLocal()) {
    localStorage.setItem("ginni_msg_date", todayLocal());
    localStorage.setItem("ginni_msg_count", "0");
  }
  return Number(localStorage.getItem("ginni_msg_count") || "0");
}

// --- Subscription: 30 days full access -----------------------------------
export function premiumUntil() {
  return Number(localStorage.getItem("ginni_premium_until") || "0");
}
export function isPremium() {
  return Date.now() < premiumUntil();
}
export function premiumDaysLeft() {
  const ms = premiumUntil() - Date.now();
  return ms > 0 ? Math.ceil(ms / DAY_MS) : 0;
}
// Set the premium expiry to an absolute epoch-ms (e.g. from the server).
export function setPremiumUntil(ts) {
  const n = Number(ts);
  if (Number.isFinite(n) && n > 0) localStorage.setItem("ginni_premium_until", String(n));
}
// Incubated grant: a fresh 30-day window (used when no payment backend is set).
export function grantPremium() {
  setPremiumUntil(Date.now() + PREMIUM_DAYS * DAY_MS);
}

export const DAILY_LIMIT = FREE_DAILY_LIMIT;

export function remaining() {
  if (isPremium()) return Infinity;
  return Math.max(0, FREE_DAILY_LIMIT - readCount());
}
export function canAsk() {
  return remaining() > 0;
}
export function recordAsk() {
  if (isPremium()) return;
  localStorage.setItem("ginni_msg_date", todayLocal());
  localStorage.setItem("ginni_msg_count", String(readCount() + 1));
}
// Force the local counter to "exhausted" (e.g. when the server reports the limit).
export function markLimitReached() {
  localStorage.setItem("ginni_msg_date", todayLocal());
  localStorage.setItem("ginni_msg_count", String(FREE_DAILY_LIMIT));
}
// Sync local UI state from an authoritative server response.
export function syncFromServer({ premiumUntil: pu, remaining: rem } = {}) {
  if (pu) setPremiumUntil(pu);
  if (typeof rem === "number") {
    localStorage.setItem("ginni_msg_date", todayLocal());
    localStorage.setItem("ginni_msg_count", String(Math.max(0, FREE_DAILY_LIMIT - rem)));
  }
}
