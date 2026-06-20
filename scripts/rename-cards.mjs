#!/usr/bin/env node
/**
 * rename-cards.mjs — rename a folder of tarot card images to the slug convention
 * used by the Ginni app (e.g. "the-star.jpg", "six-of-wands.jpg", "ace-of-cups.jpg").
 *
 * Usage:
 *   node rename-cards.mjs <folder>            # DRY RUN — shows the plan, renames nothing
 *   node rename-cards.mjs <folder> --apply    # actually renames the files
 *   node rename-cards.mjs --list              # print all 78 target slugs and exit
 *
 * Matching handles many common naming schemes:
 *   - already-correct slugs: "six-of-wands.png"
 *   - Wikimedia majors:      "RWS_Tarot_17_Star.jpg"     -> the-star
 *   - Wikimedia minors:      "Wands06.jpg" / "Pents14.jpg" -> six-of-wands / king-of-pentacles
 *   - numbered majors:       "00.jpg" / "21 the world.png"
 *   - freeform:              "Six of Wands.jpeg", "ace_cups.webp", "the moon card.jpg"
 */

import fs from "node:fs";
import path from "node:path";

// ---- canonical deck --------------------------------------------------------
const MAJOR = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World",
];
const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];
const RANKS = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
const MINOR = SUITS.flatMap((s) => RANKS.map((r) => `${r} of ${s}`));
const DECK = [...MAJOR, ...MINOR];

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const SLUGS = DECK.map(slug);

// ---- lookup helpers --------------------------------------------------------
const MAJOR_NUM = {}; // "00".."21" -> slug
MAJOR.forEach((m, i) => { MAJOR_NUM[String(i).padStart(2, "0")] = slug(m); MAJOR_NUM[String(i)] = slug(m); });

const MAJOR_KEYWORD = {
  fool: "the-fool", magician: "the-magician", "high-priestess": "the-high-priestess",
  priestess: "the-high-priestess", empress: "the-empress", emperor: "the-emperor",
  hierophant: "the-hierophant", lovers: "the-lovers", chariot: "the-chariot",
  strength: "strength", hermit: "the-hermit", wheel: "wheel-of-fortune", fortune: "wheel-of-fortune",
  justice: "justice", hanged: "the-hanged-man", death: "death", temperance: "temperance",
  devil: "the-devil", tower: "the-tower", star: "the-star", moon: "the-moon", sun: "the-sun",
  judgement: "judgement", judgment: "judgement", world: "the-world",
};

const RANK_FROM = {
  ace: "Ace", "1": "Ace", "01": "Ace", one: "Ace",
  two: "Two", "2": "Two", "02": "Two", three: "Three", "3": "Three", "03": "Three",
  four: "Four", "4": "Four", "04": "Four", five: "Five", "5": "Five", "05": "Five",
  six: "Six", "6": "Six", "06": "Six", seven: "Seven", "7": "Seven", "07": "Seven",
  eight: "Eight", "8": "Eight", "08": "Eight", nine: "Nine", "9": "Nine", "09": "Nine",
  ten: "Ten", "10": "Ten",
  page: "Page", "11": "Page", jack: "Page", knave: "Page",
  knight: "Knight", "12": "Knight", queen: "Queen", "13": "Queen", king: "King", "14": "King",
};
const SUIT_FROM = {
  wands: "Wands", wand: "Wands", rods: "Wands", staves: "Wands", batons: "Wands",
  cups: "Cups", cup: "Cups", chalices: "Cups", hearts: "Cups",
  swords: "Swords", sword: "Swords", spades: "Swords",
  pentacles: "Pentacles", pentacle: "Pentacles", pents: "Pentacles", coins: "Pentacles", disks: "Pentacles", diamonds: "Pentacles",
};

function matchCard(filenameNoExt) {
  const raw = filenameNoExt.trim();
  const s = slug(raw);

  // 1) already a valid slug
  if (SLUGS.includes(s)) return s;

  // 2) Wikimedia minor compact: wands06, pents14, sw11, cu01
  let m = raw.toLowerCase().replace(/[^a-z0-9]/g, "").match(/^(wands|cups|swords|pents|pentacles|wa|cu|sw|pe)(\d{1,2})$/);
  if (m) {
    const suitKey = { wa: "wands", cu: "cups", sw: "swords", pe: "pentacles" }[m[1]] || m[1];
    const suit = SUIT_FROM[suitKey];
    const rank = RANK_FROM[String(parseInt(m[2], 10))];
    if (suit && rank) return slug(`${rank} of ${suit}`);
  }

  const tokens = s.split("-").filter(Boolean);

  // 3) minor by tokens: rank + suit anywhere
  let foundRank = null, foundSuit = null;
  for (const t of tokens) {
    if (!foundRank && RANK_FROM[t]) foundRank = RANK_FROM[t];
    if (!foundSuit && SUIT_FROM[t]) foundSuit = SUIT_FROM[t];
  }
  if (foundRank && foundSuit) return slug(`${foundRank} of ${foundSuit}`);

  // 4) major by keyword
  for (const t of tokens) if (MAJOR_KEYWORD[t]) return MAJOR_KEYWORD[t];
  // multi-word keywords
  if (s.includes("high-priestess")) return "the-high-priestess";
  if (s.includes("hanged")) return "the-hanged-man";
  if (s.includes("wheel")) return "wheel-of-fortune";

  // 5) major by leading number (only if no suit present, to avoid clashing with minors)
  const numTok = tokens.find((t) => /^\d{1,2}$/.test(t));
  if (numTok && !foundSuit && MAJOR_NUM[numTok] !== undefined) return MAJOR_NUM[numTok];

  return null;
}

// ---- main ------------------------------------------------------------------
const args = process.argv.slice(2);
if (args.includes("--list")) {
  console.log(SLUGS.join("\n"));
  process.exit(0);
}
const apply = args.includes("--apply");
const dir = args.find((a) => !a.startsWith("--"));
if (!dir) {
  console.error("Usage: node rename-cards.mjs <folder> [--apply]   (or --list)");
  process.exit(1);
}
if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error(`Not a folder: ${dir}`);
  process.exit(1);
}

const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const files = fs.readdirSync(dir).filter((f) => exts.has(path.extname(f).toLowerCase()));

const plan = [];
const unmatched = [];
const taken = new Set();
for (const f of files) {
  const ext = path.extname(f).toLowerCase() === ".jpeg" ? ".jpg" : path.extname(f).toLowerCase();
  const target = matchCard(path.basename(f, path.extname(f)));
  if (!target) { unmatched.push(f); continue; }
  let dest = `${target}${ext}`;
  if (taken.has(dest)) { unmatched.push(`${f}  (duplicate match -> ${target})`); continue; }
  taken.add(dest);
  if (f !== dest) plan.push([f, dest]);
}

console.log(`\nFolder: ${path.resolve(dir)}`);
console.log(`Images found: ${files.length}\n`);
console.log(`Renames (${plan.length}):`);
for (const [from, to] of plan) console.log(`  ${from}  ->  ${to}`);

const matchedSlugs = new Set([...plan.map(([, t]) => t.replace(/\.[^.]+$/, "")), ...files.map((f) => matchCard(path.basename(f, path.extname(f)))).filter(Boolean)]);
const missing = SLUGS.filter((sl) => !matchedSlugs.has(sl));
console.log(`\nUnmatched files (${unmatched.length}):`);
unmatched.forEach((u) => console.log(`  ${u}`));
console.log(`\nMissing cards — no image found (${missing.length}):`);
missing.forEach((mm) => console.log(`  ${mm}`));

if (!apply) {
  console.log(`\nDRY RUN. Re-run with --apply to perform the ${plan.length} renames.`);
  process.exit(0);
}

let done = 0;
for (const [from, to] of plan) {
  const a = path.join(dir, from), b = path.join(dir, to);
  if (fs.existsSync(b)) { console.warn(`skip (exists): ${to}`); continue; }
  fs.renameSync(a, b);
  done++;
}
console.log(`\nDone. Renamed ${done} file(s).`);
