// Ginni Reading Engine — deterministic, document-grounded, ONE card per reading.
// Locked design ("blend"): strictly 1-card for every topic; the Relationship
// option returns the single drawn card's full Past/Present/Future paragraph.
// Zero hallucination: text comes verbatim from the knowledge base in
// /public/ginni-kb/. Missing {topic, card} falls back to Universe Guidance.

const BASE = (import.meta?.env?.BASE_URL || "/") + "ginni-kb/";

// Canonical 78-card order (Majors, then Wands, Cups, Swords, Pentacles) — the
// same order the source documents are written in. number (1..78) -> DECK[n-1].
const MAJORS = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World",
];
const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];
const RANKS = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
export const DECK = [...MAJORS, ...SUITS.flatMap((s) => RANKS.map((r) => `${r} of ${s}`))];

// Topic catalogue. `timing` topics all answer a "kab…" question; each maps to
// one document file under /ginni-kb/.
export const TOPICS = [
  { key: "soulmate", group: "timing", label: "Soulmate — kab milega" },
  { key: "life_partner", group: "timing", label: "Life partner — kab milega" },
  { key: "shaadi", group: "timing", label: "Shaadi — kab hogi" },
  { key: "baby", group: "timing", label: "Baby — kab hoga" },
  { key: "union", group: "timing", label: "Union — kab hoga" },
  { key: "third_party_end", group: "timing", label: "Third-party situation — kab end hogi" },
  { key: "partner_feelings", group: "feelings", label: "Partner's current feelings" },
  { key: "partner_action", group: "feelings", label: "Partner's action" },
  { key: "connection", group: "connection", label: "Connection type (Twin Flame / Soulmate / Karmic)" },
  { key: "monthly", group: "monthly", label: "Monthly prediction (Career · Love · Health · Studies)" },
  { key: "relationship_ppf", group: "relationship", label: "Relationship — Past / Present / Future (one card)" },
  { key: "yes_no", group: "yesno", label: "Yes / No" },
  { key: "universe_guidance", group: "guidance", label: "Universe guidance" },
];

const _cache = {};
async function loadTopic(key) {
  if (_cache[key]) return _cache[key];
  const res = await fetch(`${BASE}${key}.json`, { cache: "force-cache" });
  if (!res.ok) throw new Error(`KB load failed for "${key}" (${res.status})`);
  const data = await res.json();
  _cache[key] = data;
  return data;
}

// Map a user-picked number to its card. Strictly one number -> one card.
export function cardForNumber(number) {
  const n = Math.floor(Number(number));
  if (!Number.isFinite(n) || n < 1 || n > 78) return null;
  return DECK[n - 1];
}

/**
 * Reveal one grounded reading.
 * @returns {Promise<{card, number, topic, text, fallback:boolean}>}
 */
export async function getReading(topicKey, number) {
  const card = cardForNumber(number);
  if (!card) throw new Error("Please pick a number between 1 and 78.");

  const kb = await loadTopic(topicKey);
  let text = (kb[card] || "").trim();
  let fallback = false;

  // Zero-hallucination fallback: if the chosen topic has no entry for this card,
  // use the card's Universe Guidance instead of inventing a meaning.
  if (!text) {
    fallback = true;
    try {
      const ug = await loadTopic("universe_guidance");
      text = (ug[card] || "").trim();
    } catch (_) { /* ignore */ }
  }
  if (!text) {
    text = `Is card (${card}) ke liye is topic mein abhi reading available nahi hai — ek aur number chuniye. ✨`;
    fallback = true;
  }
  return { card, number: Math.floor(Number(number)), topic: topicKey, text, fallback };
}
