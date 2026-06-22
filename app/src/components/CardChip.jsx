import React, { useState } from "react";
import { cardImageSources } from "../data/tarot";

// A drawn tarot card. Tries every image source in order; if all fail, shows an
// elegant text fallback — so a card is ALWAYS rendered (never a broken image).
export default function CardChip({ card, position }) {
  const sources = cardImageSources(card.name);
  const [idx, setIdx] = useState(0);
  const src = sources[idx];

  return (
    <div className="flex w-40 shrink-0 flex-col items-center gap-1">
      <div className="relative h-56 w-40 overflow-hidden rounded-xl border border-gold/30 bg-card-grad shadow-gold">
        {src ? (
          <img
            src={src}
            alt={card.name}
            loading="lazy"
            onError={() => setIdx((i) => i + 1)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-2 text-center font-serif text-sm leading-tight text-gold">
            {card.name}
          </div>
        )}
      </div>
      <div className="text-center text-xs">
        <div className="font-medium text-gold">{position}</div>
      </div>
    </div>
  );
}
