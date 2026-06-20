import React from "react";

// Card-shuffling motion shown after the user sends a message, while Ginni
// "shuffles the deck" and prepares the reading.
export default function CardShuffle({ count = 3 }) {
  const n = Math.min(Math.max(count, 3), 5);
  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <div className="relative h-24 w-44">
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -ml-7 -mt-10 flex h-20 w-14 items-center justify-center rounded-md border border-gold/40 bg-card-grad shadow-gold animate-shuffle"
            style={{ animationDelay: `${i * 0.16}s` }}
          >
            <span className="text-gold/70">✦</span>
          </div>
        ))}
      </div>
      <span className="text-sm italic text-muted-foreground">Ginni is shuffling the deck…</span>
    </div>
  );
}
