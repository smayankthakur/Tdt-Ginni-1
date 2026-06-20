// Deterministic reading builder — uses the authored library (READINGS) for the
// 8 covered question types, and a generic per-card note for everything else.
// No LLM, no network: readings are instant and always available.

import { READINGS } from "../data/readings";

const GENERIC = {
  "The Star": "hope, healing aur nayi ummeed",
  "The Sun": "khushi, success aur positivity",
  "The Moon": "intuition aur chhupe hue sach",
  "The Lovers": "pyaar, choice aur gehra connection",
  "The Empress": "abundance, care aur creativity",
  "The Emperor": "structure, stability aur authority",
  "The World": "completion aur ek poora cycle",
  "Wheel of Fortune": "badlaav aur kismat ka pahiya",
  "Death": "transformation — ek ant jo nayi shuruat laata hai",
  "The Tower": "achanak badlaav jo sach ke kareeb laata hai",
  "Strength": "andar ki taqat, patience aur courage",
  "The Hermit": "andar ki khoj aur shaant guidance",
};

const genericText = (card) =>
  `${GENERIC[card] ? `${card} darshata hai ${GENERIC[card]}.` : `${card} aapke liye ek important sandesh leke aaya hai.`} Is energy ko dhyan se mehsoos kijiye aur apni inner voice par bharosa rakhiye.`;

export function buildReading({ type, cards, positions, lang, name }) {
  const pick = (e) => (e && (e[lang] || e.hinglish)) || "";
  const blocks = (cards || []).map((c, i) => {
    let text = "";
    if (type && READINGS[type] && READINGS[type][c.name]) text = pick(READINGS[type][c.name]);
    if (!text) text = genericText(c.name);
    return { position: positions?.[i] || "", card: c.name, text };
  });
  return { kind: type ? "authored" : "generic", name, type, blocks };
}
