// Offline fallback reading generator (no LLM). Keeps the app working end-to-end
// even with no backend, so the chat NEVER breaks.

const MEANINGS = {
  "The Star": "hope, inspiration, aur rejuvenation",
  "The Sun": "khushi, success, aur positivity",
  "The Moon": "intuition, aur chhupe hue sach",
  "The Lovers": "pyaar, choice, aur gehre connection",
  "The Empress": "abundance, nurturing, aur creativity",
  "The Emperor": "structure, authority, aur stability",
  "The World": "completion, achievement, aur ek poora cycle",
  "Wheel of Fortune": "badlaav, kismat ka pahiya, aur naye mode",
  "Death": "ek ant jo nayi shuruat laata hai, transformation",
  "The Tower": "achanak badlaav jo aapko sach ke kareeb laata hai",
  "Strength": "andar ki taqat, patience, aur courage",
  "Page of Swords": "naye ideas, curiosity, aur nayi soch",
  "Six of Wands": "vijay, recognition, aur public appreciation",
  "Ace of Cups": "naya pyaar, emotional shuruat, aur bhavnaon ka behaav",
  "Ten of Cups": "khushiyon se bhara parivaar aur emotional fulfilment",
  "The Hermit": "andar ki khoj, reflection, aur shaant guidance",
};

const generic = (card) =>
  `${card} aapke liye ek important sandesh leke aaya hai — ise dhyan se mehsoos kijiye`;

function block(position, card, name) {
  const core = MEANINGS[card.name] || generic(card.name);
  return `${position}: ${card.name} ${name}, is sthaan par ${card.name} darshata hai ${core}. Is urja ko apnaaiye aur shaant mann se aage badhiye.`;
}

export function demoReading({ name, question, positions, cards }) {
  const opening = `Welcome, ${name}. I sense the energy of your aspirations today. Jo baatein aapke zehan mein chal rahi hain, main unhe samajh sakti hoon. Let us seek clarity from the universe regarding "${question}".`;

  const revelations = cards
    .map((card, i) => block(positions[i] || `Card ${i + 1}`, card, name))
    .join("\n\n");

  const counsel = `Universe ka guidance ${name}, in cards ko jodkar dekhein toh raasta saaf hai. Apne andar ki aawaaz par bharosa rakhiye, aur jo bhi naya samne aa raha hai use darr ke bina embrace kijiye. Dheere-dheere, lekin sahi disha mein, aage badhte rahiye.`;

  const closing = `Apni inner light par vishwas rakhein, ${name}. The universe is always guiding you. ✨`;

  return `${opening}\n\nThe Revelations\n\n${revelations}\n\n${counsel}\n\n${closing}`;
}
