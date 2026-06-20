import React, { useMemo, useState } from "react";
import { CATEGORIES, TEMPLATES, SPREADS } from "../data/tarot";

export default function Composer({ spread, setSpread, onSend, locked }) {
  const [category, setCategory] = useState("ALL");
  const [value, setValue] = useState("");

  const templates = useMemo(
    () => (category === "ALL" ? TEMPLATES : TEMPLATES.filter((t) => t.category === category)),
    [category]
  );

  const send = (text) => {
    const q = (text ?? value).trim();
    if (!q || locked) return;
    onSend(q);
    setValue("");
  };

  return (
    <div className="border-t border-border bg-background/40 px-4 pt-3 backdrop-blur">
      <div className="mx-auto max-w-3xl">
        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] tracking-wide transition ${
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
          {templates.map((t) => (
            <button
              key={t.text}
              onClick={() => send(t.text)}
              disabled={locked}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-sm text-muted-foreground transition hover:border-gold/40 hover:text-foreground disabled:opacity-40"
            >
              <span>{t.emoji}</span>
              {t.text}
            </button>
          ))}
        </div>

        <div className="mb-3 flex items-center gap-3 text-xs">
          <span className="tracking-widest text-muted-foreground">SPREAD</span>
          {Object.entries(SPREADS).map(([id, s]) => (
            <button
              key={id}
              onClick={() => setSpread(Number(id))}
              className={`rounded-full px-3 py-1 transition ${
                spread === Number(id)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
          <span className="ml-auto italic text-muted-foreground">{SPREADS[spread].hint}</span>
        </div>

        <div className="flex items-center gap-2 pb-3">
          <input
            value={value}
            aria-label="Your question"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={locked}
            placeholder={
              locked
                ? "Daily limit reached — your question will be held in reserve"
                : "Pose your question…"
            }
            className="flex-1 rounded-full border border-border bg-input/60 px-5 py-3 text-foreground placeholder:text-muted-foreground outline-none transition focus:border-gold/60 disabled:opacity-60"
          />
          <button
            onClick={() => send()}
            disabled={locked || !value.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-grad text-primary-foreground shadow-gold transition hover:brightness-105 disabled:opacity-40"
            aria-label="Send"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <p className="pb-2 text-center text-xs text-muted-foreground/70">For guidance purposes only 🌙</p>
      </div>
    </div>
  );
}
