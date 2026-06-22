// Ginni Reading Engine — deterministic, document-grounded.
// Canonical 15-intent routing (see READING-AGENT-PROMPT.md). Each intent maps to
// one source file; readings are pulled verbatim from the knowledge base in
// /public/ginni-kb/ — NO LLM, so hallucination is structurally impossible.
// All intents draw ONE card except Relationship (Past/Present/Future) = 3 cards.

const BASE = (import.meta?.env?.BASE_URL || "/") + "ginni-kb/";

// Canonical 78-card order (Majors, then Wands, Cups, Swords, Pentacles).
const MAJORS = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World",
];
const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];
const RANKS = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
export const DECK = [...MAJORS, ...SUITS.flatMap((s) => RANKS.map((r) => `${r} of ${s}`))];

// The 15 intents. `file` = KB json under /ginni-kb/; `count` = cards drawn;
// `mode` = render transform (yes/no verdict handling).
export const TOPICS = [
  { key: "yes_no_guidance", label: "Yes / No (with guidance)", file: "yes_no", count: 1, mode: "yesno" },
  { key: "yes_no_direct", label: "Yes / No (direct)", file: "yes_no", count: 1, mode: "yesno_verdict" },
  { key: "daily", label: "Aaj ka din kaisa hoga", file: "daily", count: 1 },
  { key: "union", label: "Union — kab hoga", file: "union", count: 1 },
  { key: "third_party_end", label: "Third-party situation — kab end hogi", file: "third_party_end", count: 1 },
  { key: "shaadi", label: "Shaadi — kab hogi", file: "shaadi", count: 1 },
  { key: "life_partner", label: "Life partner — kab milega", file: "life_partner", count: 1 },
  { key: "baby", label: "Baby — kab hoga", file: "baby", count: 1 },
  { key: "soulmate", label: "Soulmate — kab milega", file: "soulmate", count: 1 },
  { key: "partner_feelings", label: "Partner's current feelings", file: "partner_feelings", count: 1 },
  { key: "connection", label: "Spiritual journey (Twin Flame / Soulmate / Karmic)", file: "connection", count: 1 },
  { key: "monthly", label: "Monthly prediction", file: "monthly", count: 1 },
  { key: "universe_guidance", label: "Universe guidance", file: "universe_guidance", count: 1 },
  { key: "partner_action", label: "Partner's action", file: "partner_action", count: 1 },
  { key: "relationship_ppf", label: "Relationship — Past / Present / Future", file: "relationship_ppf", count: 3 },
];
const TOPIC_BY_KEY = Object.fromEntries(TOPICS.map((t) => [t.key, t]));
export function topicMeta(key) { return TOPIC_BY_KEY[key] || TOPIC_BY_KEY["universe_guidance"]; }
export function cardCountFor(key) { return topicMeta(key).count || 1; }

// Free-text question → one intent key. Specific phrases first, general last.
const _CLASSIFY = [
  ["daily", /aaj ka din|\btoday\b|din kaisa|aaj kaisa/i],
  ["third_party_end", /third[\s-]?party|affair|interfere|interference|teesr/i],
  ["baby", /\bbaby\b|pregnan|conceive|bach(?:a|cha)|santaan|aulad|garbh/i],
  ["shaadi", /shaadi|marriage|married|vivah|byah/i],
  ["soulmate", /soulmate/i],
  ["union", /\bunion\b|milan|reunion|wapas|come ?back|reunite/i],
  ["life_partner", /life ?partner|jeevansa?thi|partner kab|kab milega.*partner/i],
  ["connection", /twin ?flame|karmic|spiritual journey|connection type|kis tarah ka connection/i],
  ["monthly", /month|mahin|is mahine|career|studies|forecast/i],
  ["partner_feelings", /feel|feeling|soch|dil mein|mann mein|kya sochta|kya soch rah/i],
  ["partner_action", /action|kya kareg|next move|contact kareg|reach out|wapas aayega/i],
  ["relationship_ppf", /past.*present.*future|relationship status|relationship dynamic|\bppf\b|rishta|relationship/i],
  ["yes_no_guidance", /yes ?\/? ?no|haan ya nahi|will i|should i|kya .* hoga\??/i],
  ["universe_guidance", /guidance|universe|advice|margdarshan|message/i],
];
export function classifyTopic(text) {
  const t = (text || "").toLowerCase();
  for (const [key, re] of _CLASSIFY) if (re.test(t)) return key;
  return "universe_guidance";
}

const _cache = {};
async function loadFile(file) {
  if (_cache[file]) return _cache[file];
  try {
    const res = await fetch(`${BASE}${file}.json`, { cache: "force-cache" });
    if (!res.ok) { _cache[file] = {}; return {}; }          // missing topic (e.g. daily) → empty → fallback
    const data = await res.json();
    _cache[file] = data;
    return data;
  } catch (_) { _cache[file] = {}; return {}; }
}

// Yes/No entries look like: "The Fool – YESGUIDEANCE - New beginning, leap of faith lo…"
function yesnoParse(raw) {
  const m = raw.match(/[–—-]\s*(.*?)\s*GUID[EI]ANCE\s*[-–—]?\s*([\s\S]*)$/i);
  if (!m) return { verdict: raw, guidance: "" };
  return { verdict: m[1].trim(), guidance: m[2].trim() };
}

// Strip Word export junk ("Top of Form" / "Bottom of Form") that leaked into the docs.
function cleanArtifacts(s) {
  return s.split("\n").filter((l) => !/^\s*(top|bottom)\s+of\s+(the\s+)?form\s*$/i.test(l)).join("\n").trim();
}

export const LANGUAGES = [
  { id: "hinglish", label: "Hinglish" },
  { id: "english", label: "English" },
  { id: "hindi", label: "हिंदी" },
];

// Many entries hold three language blocks: "Hinglish:… English:… Hindi:…". Return
// only the requested one (fallback Hinglish → English → first). Single-language
// entries (no labels) are returned cleaned, unchanged.
export function extractLanguage(raw, lang = "hinglish") {
  const s = cleanArtifacts(raw || "");
  // Match the language labels in BOTH styles the docs use: "Hinglish: …" (colon,
  // content on the same line) and "Hinglish⏎…" (label alone on its own line).
  // Includes the stray "Hindiq:" typo. We only SLICE existing text — never translate.
  const re = /(^|\n)[ \t]*(Hinglish|English|Hindi\w*)[ \t]*(?::|(?=\r?\n)|$)/gi;
  const ms = [...s.matchAll(re)];
  if (!ms.length) return s; // single-language entry → return file text as-is
  const blocks = {};
  for (let i = 0; i < ms.length; i++) {
    const lab = ms[i][2].toLowerCase();
    const key = lab.startsWith("hinglish") ? "hinglish" : lab.startsWith("hindi") ? "hindi" : "english";
    const start = ms[i].index + ms[i][0].length;
    const end = i + 1 < ms.length ? ms[i + 1].index : s.length;
    blocks[key] = (s.slice(start, end).trim() || blocks[key] || "");
  }
  const want = (lang || "hinglish").toLowerCase();
  return blocks[want] || blocks.hinglish || blocks.english || Object.values(blocks)[0] || s;
}

export function cardForNumber(number) {
  const n = Math.floor(Number(number));
  if (!Number.isFinite(n) || n < 1 || n > 78) return null;
  return DECK[n - 1];
}

/**
 * Grounded reading for one card under one intent. Falls back to Universe
 * Guidance when the intent has no entry for that card (or the file is missing).
 * @returns {Promise<{card, topic, text, fallback:boolean}>}
 */
export async function getReadingByCard(topicKey, cardName, lang = "hinglish") {
  if (!cardName) throw new Error("No card drawn.");
  const meta = topicMeta(topicKey);
  let raw = (await loadFile(meta.file))[cardName];
  raw = (raw || "").trim();
  let fallback = false;

  if (!raw) {
    fallback = true;
    raw = ((await loadFile("universe_guidance"))[cardName] || "").trim();
  }
  if (!raw) {
    return { card: cardName, topic: topicKey, text: `Is card (${cardName}) ki reading abhi available nahi hai — ek aur card draw kijiye. ✨`, fallback: true };
  }

  let text;
  if (!fallback && meta.mode === "yesno") {
    const { verdict, guidance } = yesnoParse(raw);
    text = guidance ? `${verdict} — ${guidance}` : verdict;
  } else if (!fallback && meta.mode === "yesno_verdict") {
    text = yesnoParse(raw).verdict;
  } else {
    text = extractLanguage(raw, lang); // pick the requested language + strip artifacts
  }
  return { card: cardName, topic: topicKey, text, fallback };
}

/**
 * Grounded reading for a picked number (1..78) under one intent.
 * @returns {Promise<{card, number, topic, text, fallback:boolean}>}
 */
export async function getReading(topicKey, number, lang = "hinglish") {
  const card = cardForNumber(number);
  if (!card) throw new Error("Please pick a number between 1 and 78.");
  const r = await getReadingByCard(topicKey, card, lang);
  return { ...r, number: Math.floor(Number(number)) };
}
