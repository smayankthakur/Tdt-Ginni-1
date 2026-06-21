// Deterministic, question-aware reading builder with 5 languages.
import { READINGS } from "../data/readings";
import { typeForQuestion } from "../data/tarot";
import { MEANINGS } from "../data/meanings";

export function hash(str) {
  let h = 2166136261; const s = String(str || "");
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const pick = (arr, seed) => arr[hash(seed) % arr.length];

export function detectType(question, explicit) {
  if (explicit && READINGS[explicit]) return explicit;
  const exact = typeForQuestion(question);
  if (exact && READINGS[exact]) return exact;
  const q = (question || "").toLowerCase();
  if (/(third\s*party|teesr|woh\s*dusr|affair|love\s*triangle)/.test(q)) return "third_party";
  if (/(shaadi|shadi|marriage|married|vivah|wedding)/.test(q)) return "shaadi";
  if (/(life\s*partner|jeevan\s*saathi|jeevansaathi|jiwan)/.test(q)) return "life_partner";
  if (/(baby|pregnan|conceiv|bachch|maa\s*ban)/.test(q)) return "baby";
  if (/(soulmate|soul\s*mate|humsafar)/.test(q)) return "soulmate";
  if (/(current\s*feeling|partner.*(feel|soch|dil)|unki?\s*feeling)/.test(q)) return "partner_feelings";
  if (/(spiritual|twin\s*flame|journey|aatm|aatma)/.test(q)) return "spiritual_journey";
  if (/(this\s*month|month|mahin|mahina)/.test(q)) return "this_month";
  return null;
}

/* ---- language helpers (5 ids: hinglish, en-in, en-us, en-uk, hindi) ---- */
const LANG_FIELD = { hinglish: "hinglish", english: "english", "en-in": "english", "en-us": "english", "en-uk": "english", hindi: "hindi" };
const frameLangFor = (lang) => (lang === "hindi" ? "hindi" : lang === "hinglish" ? "hinglish" : "english");
const TRANSLATION_NOTE = { hindi: "(अनुवाद जल्द आ रहा है)" }; // others default below

// US/UK spelling pairs [american, british]
const SPELL = [
  ["color", "colour"], ["favor", "favour"], ["honor", "honour"], ["behavior", "behaviour"],
  ["neighbor", "neighbour"], ["labor", "labour"], ["rumor", "rumour"], ["humor", "humour"],
  ["realize", "realise"], ["realized", "realised"], ["realizing", "realising"],
  ["organize", "organise"], ["organized", "organised"], ["recognize", "recognise"],
  ["recognized", "recognised"], ["analyze", "analyse"], ["apologize", "apologise"],
  ["prioritize", "prioritise"], ["emphasize", "emphasise"], ["center", "centre"],
  ["centered", "centred"], ["meter", "metre"], ["theater", "theatre"], ["fiber", "fibre"],
  ["program", "programme"], ["traveled", "travelled"], ["traveling", "travelling"],
  ["counselor", "counsellor"], ["jewelry", "jewellery"], ["fulfill", "fulfil"],
  ["fulfillment", "fulfilment"], ["enroll", "enrol"], ["gray", "grey"],
  ["defense", "defence"], ["offense", "offence"], ["license", "licence"],
];
function swap(text, from, to) {
  return String(text).replace(new RegExp("\\b" + from + "\\b", "gi"), (m) =>
    m[0] === m[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to
  );
}
function applyLocale(text, lang) {
  if (lang !== "en-us" && lang !== "en-uk") return text;
  let t = text;
  for (const [us, uk] of SPELL) {
    const from = lang === "en-us" ? uk : us;
    const to = lang === "en-us" ? us : uk;
    t = swap(t, from, to);
  }
  return t;
}

/* ------------------------------ framing copy ------------------------------ */
export const FRAME = {
  hinglish: {
    Past: ["Beete waqt mein, {card} ne is sawaal ki neenv rakhi —", "Past mein {card} ki energy ye keh rahi thi —"],
    Present: ["Abhi {card} aapke sawaal par seedhi roshni daal raha hai —", "Is waqt {card} ka sandesh hai —"],
    Future: ["Aane wale samay mein {card} ishaara karta hai —", "Future ki ore, {card} ye sankay deta hai —"],
    Focus: ["Is sawaal ke kendra mein {card} hai —"],
    Situation: ["Situation ko {card} aise dikhata hai —"], Obstacle: ["Rukawat ke roop mein {card} kehta hai —"],
    Advice: ["{card} ki salah hai —"], Influences: ["Aas-paas ki energy, {card} ke through —"],
    Outcome: ["Parinaam ki ore {card} dikhata hai —"], default: ["{card} aapke sawaal par kehta hai —"],
  },
  english: {
    Past: ["In the past, {card} laid the foundation of this question —", "{card}'s energy in your past was saying —"],
    Present: ["Right now, {card} shines directly on your question —", "At this moment, {card}'s message is —"],
    Future: ["In the time ahead, {card} points toward —", "Looking forward, {card} signals —"],
    Focus: ["At the heart of this question sits {card} —"],
    Situation: ["{card} shows the situation as —"], Obstacle: ["As the obstacle, {card} says —"],
    Advice: ["{card}'s advice is —"], Influences: ["The surrounding energy, through {card} —"],
    Outcome: ["Toward the outcome, {card} shows —"], default: ["On your question, {card} says —"],
  },
  hindi: {
    Past: ["बीते समय में, {card} ने इस सवाल की नींव रखी —", "अतीत में {card} की ऊर्जा यह कह रही थी —"],
    Present: ["अभी {card} आपके सवाल पर सीधी रोशनी डाल रहा है —", "इस समय {card} का संदेश है —"],
    Future: ["आने वाले समय में {card} इशारा करता है —", "भविष्य की ओर, {card} यह संकेत देता है —"],
    Focus: ["इस सवाल के केंद्र में {card} है —"],
    Situation: ["स्थिति को {card} ऐसे दिखाता है —"], Obstacle: ["रुकावट के रूप में {card} कहता है —"],
    Advice: ["{card} की सलाह है —"], Influences: ["आस-पास की ऊर्जा, {card} के ज़रिए —"],
    Outcome: ["परिणाम की ओर {card} दिखाता है —"], default: ["आपके सवाल पर {card} कहता है —"],
  },
};

export const CLOSERS = {
  hinglish: [
    "Universe keh raha hai: dhairya rakho, sahi samay khud raasta khol dega.",
    "Bharosa rakho — jo aapke liye likha hai, woh der se hi sahi, zaroor aayega.",
    "Apni inner voice par yakeen rakho; signs aapko sahi disha dikhate rahenge.",
    "Jaldi mat karo; energy abhi shape le rahi hai, aur woh aapke favour mein hai.",
  ],
  english: [
    "The universe says: stay patient — the right timing will open the path itself.",
    "Trust the process; what is meant for you will arrive, even if a little late.",
    "Lean on your inner voice; the signs will keep pointing you the right way.",
    "Don't rush — the energy is still taking shape, and it leans in your favour.",
  ],
  hindi: [
    "ब्रह्मांड कहता है: धैर्य रखो, सही समय खुद रास्ता खोल देगा।",
    "भरोसा रखो — जो आपके लिए लिखा है, वह देर से ही सही, ज़रूर आएगा।",
    "अपनी अंतरात्मा की आवाज़ पर यकीन रखो; संकेत सही दिशा दिखाते रहेंगे।",
    "जल्दी मत करो; ऊर्जा अभी आकार ले रही है, और वह आपके पक्ष में है।",
  ],
};

const LEAD = {
  hinglish: ['Aapne poocha "{q}" — cards ko jodkar dekhein toh tasveer saaf ho rahi hai.', 'Aapke sawaal "{q}" par tino energies milkar ye keh rahi hain.', 'Is sawaal — "{q}" — ke jawaab mein cards ek dishaa dikha rahe hain.'],
  english: ['You asked "{q}" — reading the cards together, the picture grows clear.', 'On your question "{q}", the energies combine to say this.', 'In answer to "{q}", the cards point to one direction.'],
  hindi: ['आपने पूछा "{q}" — कार्ड्स को जोड़कर देखें तो तस्वीर साफ़ हो रही है।', 'आपके सवाल "{q}" पर ऊर्जाएँ मिलकर यह कह रही हैं।', 'इस सवाल — "{q}" — के जवाब में कार्ड्स एक दिशा दिखा रहे हैं।'],
};
const SYNTH = {
  hinglish: ["{cards} ki energy ek saath aapko balance aur clarity ki ore le ja rahi hai."],
  english: ["The combined energy of {cards} is moving you toward balance and clarity."],
  hindi: ["{cards} की ऊर्जा मिलकर आपको संतुलन और स्पष्टता की ओर ले जा रही है।"],
};

/* ------------------------------ generic core ------------------------------ */
const genericText = (card, lang) => {
  const m = MEANINGS[card] || {};
  if (lang === "hindi") {
    const mean = m.hindi || "ek important sandesh";
    return card + " \u0926\u0930\u094d\u0936\u093e\u0924\u093e \u0939\u0948 " + mean + "\u0964 \u0907\u0938 \u090a\u0930\u094d\u091c\u093e \u0915\u094b \u0905\u092a\u0928\u0947 \u0938\u0935\u093e\u0932 \u0915\u0947 \u0938\u0902\u0926\u0930\u094d\u092d \u092e\u0947\u0902 \u092e\u0939\u0938\u0942\u0938 \u0915\u0940\u091c\u093f\u090f \u0914\u0930 \u0905\u092a\u0928\u0940 \u0905\u0902\u0924\u0930\u093e\u0924\u094d\u092e\u093e \u092a\u0930 \u092d\u0930\u094b\u0938\u093e \u0930\u0916\u093f\u090f\u0964";
  }
  if (lang && lang.indexOf("en") === 0) {
    const mean = m.english || "an important message for you";
    return card + " represents " + mean + ". Feel this energy in the context of your question, and trust your inner voice.";
  }
  const mean = m.hinglish || "aapke liye ek important sandesh";
  return card + " darshata hai " + mean + ". Is energy ko apne sawaal ke sandarbh mein mehsoos kijiye aur apni inner voice par bharosa rakhiye.";
};


/* ---- outcome extraction (timing) from the authored combined.md text ---- */
export function extractOutcome(text) {
  const t = String(text || "");
  let m = t.match(/(\d{1,2})\s*[\u2013\u2014-]\s*(\d{1,2})\s*(months|month|mahino|mahine|mahina|\u092e\u0939\u0940\u0928)/i);
  if (m) return { min: +m[1], max: +m[2] };
  m = t.match(/(\d{1,2})\s*(months|month|mahino|mahine|mahina|\u092e\u0939\u0940\u0928)/i);
  if (m) return { min: +m[1], max: +m[1] };
  if (/next year|following year|agle saal|agle\s*ek\s*saal|next\s*1\s*year|\u0905\u0917\u0932\u0947\s*\u0938\u093e\u0932|\u0905\u0917\u0932\u0947\s*\u0935\u0930\u094d\u0937/i.test(t)) return { min: 12, max: 12 };
  return null;
}
function timingPhrase(min, max, lang) {
  const L = frameLangFor(lang);
  const span = min === max ? `${min}` : `${min}\u2013${max}`;
  if (L === "hindi") return `\u0915\u093e\u0930\u094d\u0921\u094d\u0938 \u0915\u0947 \u0939\u093f\u0938\u093e\u0926 \u0938\u0947 \u0938\u092c\u0938\u0947 \u092e\u091c\u093c\u092c\u0942\u0924 \u0938\u092e\u092f \u0932\u0917\u092d\u0917 ${span} \u092e\u0939\u0940\u0928\u094b\u0902 \u0915\u0947 \u092d\u0940\u0924\u0930 \u0932\u0917 \u0930\u0939\u093e \u0939\u0948\u0964`;
  if (L === "english") return `Across the cards, the strongest window looks to be about ${span} month${max > 1 ? "s" : ""}.`;
  return `Cards ke hisaab se sabse strong window lagbhag ${span} mahino ke andar lag rahi hai.`;
}

/* ------------------------------ frame + guidance -------------------------- */
function frameFor(position, card, question, lang) {
  const L = frameLangFor(lang);
  const set = FRAME[L][position] || FRAME[L].default;
  return pick(set, `${question}|${card}|${position}|${L}`).replace("{card}", card);
}

export function guidanceFor({ cards, positions, question, lang, timing }) {
  const L = frameLangFor(lang);
  const q = (question || "").trim();
  const qShort = q.length > 90 ? q.slice(0, 87) + "…" : q;
  const names = (cards || []).map((c) => c.name);
  const lead = q ? pick(LEAD[L], q).replace("{q}", qShort) : "";
  const synth = pick(SYNTH[L], names.join(",")).replace("{cards}", names.join(", "));
  const closer = pick(CLOSERS[L], q + "|" + names.join(","));
  const tline = timing ? timingPhrase(timing.min, timing.max, lang) : "";
  return [lead, tline, synth, closer].filter(Boolean).join(" ");
}

/* ------------------------------ buildReading ------------------------------ */
export function buildReading({ type, cards, positions, lang, name, question }) {
  const L = lang || "hinglish";
  const rtype = detectType(question, type);
  const field = LANG_FIELD[L] || "hinglish";

  const blocks = (cards || []).map((c, i) => {
    const position = positions?.[i] || "";
    const entry = rtype && READINGS[rtype] ? READINGS[rtype][c.name] : null;
    let text = "";
    let note = "";
    if (entry) {
      text = entry[field] || "";
      if (!text) {
        text = entry.hinglish || "";
        if (text && L !== "hinglish") note = TRANSLATION_NOTE[L] || "(Translation coming soon)";
      }
    }
    if (!text) text = genericText(c.name, L);
    text = applyLocale(text, L);
    const frame = applyLocale(frameFor(position, c.name, question, L), L);
    return { position, card: c.name, frame, text, note };
  });

  const outs = blocks.map((b) => extractOutcome(b.text)).filter(Boolean);
  const timing = outs.length ? { min: Math.min(...outs.map((o) => o.min)), max: Math.max(...outs.map((o) => o.max)) } : null;
  const guidance = applyLocale(guidanceFor({ cards: cards || [], positions: positions || [], question, lang: L, timing }), L);
  return { kind: rtype ? "authored" : "generic", type: rtype, name, question, blocks, guidance };
}
