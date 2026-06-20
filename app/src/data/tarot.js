// ---------------------------------------------------------------------------
// Ginni Ki Baatein — tarot data
// Full 78-card Rider–Waite deck (all upright), spreads, templates, categories.
// ---------------------------------------------------------------------------

const MAJOR = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World",
];

const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];
const RANKS = [
  "Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Page", "Knight", "Queen", "King",
];

const MINOR = SUITS.flatMap((suit) => RANKS.map((rank) => `${rank} of ${suit}`));

export const DECK = [...MAJOR, ...MINOR]; // 78 cards

// --- Card art -------------------------------------------------------------
// Reliable default: public-domain Rider–Waite–Smith deck from Wikimedia Commons.
// Optional override: set VITE_CARD_IMAGE_BASE to a folder hosting <slug>.jpg/png/webp
// (e.g. your GitHub raw URL). Sources are tried in order so an image ALWAYS loads.

const WIKI_MAJOR = {
  "The Fool": "00_Fool", "The Magician": "01_Magician", "The High Priestess": "02_High_Priestess",
  "The Empress": "03_Empress", "The Emperor": "04_Emperor", "The Hierophant": "05_Hierophant",
  "The Lovers": "06_Lovers", "The Chariot": "07_Chariot", "Strength": "08_Strength",
  "The Hermit": "09_Hermit", "Wheel of Fortune": "10_Wheel_of_Fortune", "Justice": "11_Justice",
  "The Hanged Man": "12_Hanged_Man", "Death": "13_Death", "Temperance": "14_Temperance",
  "The Devil": "15_Devil", "The Tower": "16_Tower", "The Star": "17_Star", "The Moon": "18_Moon",
  "The Sun": "19_Sun", "Judgement": "20_Judgement", "The World": "21_World",
};
const SUIT_PREFIX = { Wands: "Wands", Cups: "Cups", Swords: "Swords", Pentacles: "Pents" };
const RANK_NUM = {
  Ace: "01", Two: "02", Three: "03", Four: "04", Five: "05", Six: "06", Seven: "07",
  Eight: "08", Nine: "09", Ten: "10", Page: "11", Knight: "12", Queen: "13", King: "14",
};

const WIKI_BASE = "https://commons.wikimedia.org/wiki/Special:FilePath/";
const CUSTOM_BASE = (import.meta.env.VITE_CARD_IMAGE_BASE || "").replace(/\/$/, "");

function wikiFile(name) {
  if (WIKI_MAJOR[name]) return `RWS_Tarot_${WIKI_MAJOR[name]}.jpg`;
  const m = name.match(/^(\w+) of (\w+)$/);
  if (m) {
    const num = RANK_NUM[m[1]];
    const suit = SUIT_PREFIX[m[2]];
    if (num && suit) return `${suit}${num}.jpg`;
  }
  return null;
}

export function cardSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Ordered list of candidate image URLs to try for a card.
export function cardImageSources(name) {
  const srcs = [];
  if (CUSTOM_BASE) {
    const slug = cardSlug(name);
    srcs.push(`${CUSTOM_BASE}/${slug}.jpg`, `${CUSTOM_BASE}/${slug}.png`, `${CUSTOM_BASE}/${slug}.webp`);
  }
  const wf = wikiFile(name);
  if (wf) srcs.push(`${WIKI_BASE}${wf}?width=420`);
  return srcs;
}

export const cardImage = (name) => cardImageSources(name)[0] || "";

// Draw `n` unique cards — all UPRIGHT (no reversed cards).
export function drawCards(n) {
  const pool = [...DECK];
  const out = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const [name] = pool.splice(idx, 1);
    out.push({ name });
  }
  return out;
}

export const SPREADS = {
  1: { label: "1 card", count: 1, positions: ["Focus"], hint: "A single guiding card" },
  3: { label: "3 cards", count: 3, positions: ["Past", "Present", "Future"], hint: "Past · Present · Future" },
  5: {
    label: "5 cards", count: 5,
    positions: ["Situation", "Obstacle", "Advice", "Influences", "Outcome"],
    hint: "Situation · Obstacle · Advice · Influences · Outcome",
  },
};

export const CATEGORIES = [
  "ALL", "MATTERS OF THE HEART", "BONDS & LINEAGE", "SPIRITUAL ALIGNMENT", "DAILY ILLUMINATION",
];

export const TEMPLATES = [
  { emoji: "🪄", text: "Yes / No reading", category: "DAILY ILLUMINATION" },
  { emoji: "🌅", text: "Aapka aaj ka din kaisa hoga", category: "DAILY ILLUMINATION" },
  { emoji: "💞", text: "Aapka union kab hoga", category: "MATTERS OF THE HEART" },
  { emoji: "🚫", text: "Third party situation kab end hogi", category: "MATTERS OF THE HEART" },
  { emoji: "💍", text: "Aapki shaadi kab hogi", category: "MATTERS OF THE HEART" },
  { emoji: "💖", text: "Aapko life partner kab milega", category: "MATTERS OF THE HEART" },
  { emoji: "✨", text: "Aapko soulmate kab milega", category: "MATTERS OF THE HEART" },
  { emoji: "👶", text: "Aapko baby kab hoga", category: "BONDS & LINEAGE" },
  { emoji: "💭", text: "Partner current feelings", category: "MATTERS OF THE HEART" },
  { emoji: "🎯", text: "Your partner's next action", category: "MATTERS OF THE HEART" },
  { emoji: "🔮", text: "Relationship past, present, future", category: "MATTERS OF THE HEART" },
  { emoji: "🕉️", text: "Spiritual journey reading", category: "SPIRITUAL ALIGNMENT" },
  { emoji: "🗓️", text: "This month for you", category: "DAILY ILLUMINATION" },
  { emoji: "🌌", text: "Universe guidance", category: "SPIRITUAL ALIGNMENT" },
];

export const welcomeMessage = (name) =>
  `Welcome, ${name}. Main Ginni hoon. Ek gehri saans lijiye, aur jab aap tayyar hon, woh sawaal poochhiye jo aapke zehan mein chal raha hai. The cards will speak with the grace it deserves. 🌌`;

// --- Authored-reading mapping (from combined.md) ---------------------------
export const TYPE_BY_TEMPLATE = {
  "Third party situation kab end hogi": "third_party",
  "Aapki shaadi kab hogi": "shaadi",
  "Aapko life partner kab milega": "life_partner",
  "Aapko baby kab hoga": "baby",
  "Aapko soulmate kab milega": "soulmate",
  "Partner current feelings": "partner_feelings",
  "Spiritual journey reading": "spiritual_journey",
  "This month for you": "this_month",
};
export const TYPE_LABELS = {
  third_party: "Third party situation",
  shaadi: "Shaadi kab hogi",
  life_partner: "Life partner kab milega",
  baby: "Baby kab hoga",
  soulmate: "Soulmate kab milega",
  partner_feelings: "Partner ki current feelings",
  spiritual_journey: "Spiritual journey",
  this_month: "This month for you",
};
export const LANGS = [
  { id: "hinglish", label: "Hinglish" },
  { id: "english", label: "English" },
  { id: "hindi", label: "हिंदी" },
];
export const typeForQuestion = (text) => TYPE_BY_TEMPLATE[(text || "").trim()] || null;
