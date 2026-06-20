import React from "react";
import CardChip from "./CardChip";
import CardShuffle from "./CardShuffle";

const HEADINGS = { "the revelations": "The Revelations", "universe ka guidance": "Universe ka guidance" };
const POSITIONS = ["Past", "Present", "Future", "Focus", "Situation", "Obstacle", "Advice", "Influences", "Outcome"];
const POS_RE = new RegExp(`^(${POSITIONS.join("|")}|Card \\d+):\\s+([\\s\\S]*)$`);

// Strip markdown bold/heading markers and a trailing colon, for tolerant matching.
const norm = (s) => s.replace(/^#+\s*/, "").replace(/\*+/g, "").replace(/:\s*$/, "").trim();
const canonicalHeading = (s) => HEADINGS[norm(s).toLowerCase()] || null;

function CardStrip({ cards, positions }) {
  if (!cards || !cards.length) return null;
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
      {cards.map((c, idx) => (
        <CardChip key={idx} card={c} position={positions[idx] || ""} />
      ))}
    </div>
  );
}

function GinniBody({ text, cards, positions }) {
  const safe = typeof text === "string" ? text : "";
  const paragraphs = safe.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const hasRevelations = paragraphs.some((p) => canonicalHeading(p) === "The Revelations");
  let cardsShown = false;
  const out = [];

  paragraphs.forEach((para, i) => {
    const heading = canonicalHeading(para); // whole paragraph is just a heading

    if (heading) {
      out.push(
        <div key={`h${i}`} className="space-y-2">
          <h3 className="font-serif text-lg text-gold">{heading}</h3>
          {heading === "The Revelations" && !cardsShown && (
            (cardsShown = true), (<CardStrip cards={cards} positions={positions} />)
          )}
        </div>
      );
      return;
    }

    // Inline heading at the start of a paragraph (e.g. "Universe ka guidance ...").
    const inlineKey = Object.keys(HEADINGS).find((h) => norm(para).toLowerCase().startsWith(h + " "));
    if (inlineKey) {
      const label = HEADINGS[inlineKey];
      const rest = norm(para).slice(label.length).trim();
      out.push(
        <p key={`i${i}`} className="text-[15px] leading-relaxed text-foreground/90">
          <span className="font-serif text-lg text-gold">{label}</span> {rest}
        </p>
      );
      return;
    }

    // Card position line, e.g. "Past: The Star ...".
    const m = para.match(POS_RE);
    if (m) {
      if (!hasRevelations && !cardsShown) {
        cardsShown = true;
        out.push(<CardStrip key={`cs${i}`} cards={cards} positions={positions} />);
      }
      out.push(
        <p key={`c${i}`} className="text-[15px] leading-relaxed text-foreground/90">
          <span className="font-semibold text-gold">{m[1]}:</span> {m[2]}
        </p>
      );
      return;
    }

    out.push(
      <p key={`p${i}`} className="text-[15px] leading-relaxed text-foreground/90">
        {para}
      </p>
    );
  });

  // Guarantee the card strip is shown even if the model omitted the heading/labels.
  if (!cardsShown && cards && cards.length) {
    out.splice(1, 0, <CardStrip key="cs-fallback" cards={cards} positions={positions} />);
  }

  return <div className="space-y-3">{out}</div>;
}

export default function Message({ msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] animate-rise rounded-2xl bg-bubble-user px-4 py-2.5 font-medium text-primary-foreground shadow-gold">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] animate-rise rounded-2xl border border-border bg-bubble-ginni px-5 py-4 shadow-card">
        {msg.pending ? (
          <CardShuffle count={msg.count || 3} />
        ) : (
          <GinniBody text={msg.text} cards={msg.cards} positions={msg.positions || []} />
        )}
      </div>
    </div>
  );
}
