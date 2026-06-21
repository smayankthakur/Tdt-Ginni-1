import React, { useEffect, useMemo, useRef, useState } from "react";
import { DECK } from "../data/tarot";
import CardShuffle from "./CardShuffle";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function CardBack({ chosen, dim }) {
  return (
    <div
      className={`relative h-full w-full rounded-lg border bg-card-grad transition-all duration-300 ${
        chosen ? "border-gold gx-glow" : "border-gold/35"
      } ${dim ? "opacity-40" : ""}`}
    >
      <div className="absolute inset-1 rounded-md border border-gold/20" />
      <div className="flex h-full w-full items-center justify-center">
        <span className={`font-serif text-lg ${chosen ? "text-gold" : "text-gold/60"}`}>✦</span>
      </div>
      {chosen && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gold-grad px-1.5 text-[10px] font-bold text-primary-foreground shadow-gold">
          ✓
        </div>
      )}
    </div>
  );
}

export default function CardPicker({ open, count, onComplete, onCancel }) {
  const [phase, setPhase] = useState("shuffling"); // shuffling -> spread -> selecting -> chosen
  const [selected, setSelected] = useState([]);
  const deck = useMemo(() => (open ? shuffle(DECK) : []), [open]);
  const onCompleteRef = useRef(onComplete);
  const chosenCardsRef = useRef([]);
  onCompleteRef.current = onComplete;

  // reset + intro timeline whenever the picker opens
  useEffect(() => {
    if (!open) return;
    setSelected([]);
    chosenCardsRef.current = [];
    setPhase("shuffling");
    const t1 = setTimeout(() => setPhase("spread"), 1700);
    const t2 = setTimeout(() => setPhase("selecting"), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [open]);

  // auto-launch the reading once the final card is chosen (depends only on phase,
  // so re-renders can't cancel the timer)
  useEffect(() => {
    if (phase !== "chosen") return;
    const t = setTimeout(() => onCompleteRef.current(chosenCardsRef.current), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  if (!open) return null;

  const toggle = (i) => {
    if (phase !== "selecting") return;
    setSelected((s) => {
      const next = s.includes(i) ? s.filter((x) => x !== i) : s.length < count ? [...s, i] : s;
      if (next.length === count) {
        chosenCardsRef.current = next.map((idx) => ({ name: deck[idx] }));
        setPhase("chosen");
      }
      return next;
    });
  };

  const remaining = count - selected.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-cosmic gx-fade-in">
      <div className="pointer-events-none absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <div>
          <div className="font-serif text-xl text-gold">Apne cards chuniye</div>
          <div className="text-xs text-muted-foreground">
            {phase === "shuffling"
              ? "Ginni is shuffling the deck…"
              : phase === "chosen"
              ? "The cards have chosen. Aapka reading khul raha hai… ✨"
              : `Choose ${count} card${count > 1 ? "s" : ""} that call to you — ${remaining} remaining`}
          </div>
        </div>
        {phase !== "chosen" && (
          <button
            onClick={onCancel}
            className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-sm text-muted-foreground transition hover:text-foreground"
          >
            ✕ Cancel
          </button>
        )}
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-2">
        {phase !== "shuffling" && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-black/60 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-black/60 to-transparent" />
          </>
        )}
        {phase === "shuffling" ? (
          <CardShuffle count={count} />
        ) : (
          <div className="no-scrollbar w-full overflow-x-auto px-6 py-16">
            <div className="mx-auto flex w-max items-end">
              {deck.map((_, i) => {
                const chosen = selected.includes(i);
                const locked = selected.length >= count && !chosen;
                return (
                  <button
                    key={i}
                    onClick={() => toggle(i)}
                    aria-label="A face-down tarot card"
                    style={{ marginLeft: i === 0 ? 0 : -42, animationDelay: `${Math.min(i * 12, 900)}ms`, zIndex: chosen ? 200 : i }}
                    className={`gx-deal h-32 w-20 shrink-0 rounded-lg outline-none transition-transform duration-300 hover:z-[150] ${
                      chosen ? "-translate-y-10" : phase === "selecting" ? "hover:-translate-y-6" : ""
                    }`}
                  >
                    <CardBack chosen={chosen} dim={locked} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 px-5 py-4 text-center text-xs text-muted-foreground/70">
        {phase === "selecting" ? "Trust your intuition — the cards are face-down for a reason. 🌙" : " "}
      </div>
    </div>
  );
}
