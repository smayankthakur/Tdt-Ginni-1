import React from "react";
import CardChip from "./CardChip";
import CardShuffle from "./CardShuffle";

const HEADINGS = { "the revelations": "The Revelations", "universe ka guidance": "Universe ka guidance" };
const norm = (s) => s.replace(/^#+\s*/, "").replace(/\*+/g, "").replace(/:\s*$/, "").trim();
const canonicalHeading = (s) => HEADINGS[norm(s).toLowerCase()] || null;
const isBullet = (l) => /^(-\s*>?|>|•|\*)\s+/.test(l);
const stripBullet = (l) => l.replace(/^(-\s*>?|>|•|\*)\s+/, "");

// inline **bold** and *italic*
function renderInline(s) {
  const nodes = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
  let last = 0, m, k = 0;
  const str = String(s);
  while ((m = re.exec(str))) {
    if (m.index > last) nodes.push(<span key={k++}>{str.slice(last, m.index)}</span>);
    const tok = m[0];
    if (tok.startsWith("**")) nodes.push(<strong key={k++} className="text-gold">{tok.slice(2, -2)}</strong>);
    else nodes.push(<em key={k++}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < str.length) nodes.push(<span key={k++}>{str.slice(last)}</span>);
  return nodes;
}

// Render authored text: paragraphs, bullet lists, bold/italic — stripping stray markdown.
function Markup({ text }) {
  const blocks = String(text || "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((b, bi) => {
        const lines = b.split(/\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length > 1 && lines.every(isBullet)) {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-foreground/90">
              {lines.map((l, li) => <li key={li}>{renderInline(stripBullet(l))}</li>)}
            </ul>
          );
        }
        const cleaned = lines.map((l) => (isBullet(l) ? stripBullet(l) : l)).join("\n");
        return (
          <p key={bi} className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
            {renderInline(cleaned)}
          </p>
        );
      })}
    </>
  );
}

function CardStrip({ blocks }) {
  if (!blocks?.length) return null;
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
      {blocks.map((b, i) => (
        <CardChip key={i} card={{ name: b.card }} position={b.position} />
      ))}
    </div>
  );
}

function AuthoredReading({ reading, name }) {
  return (
    <div className="space-y-4">
      <p className="text-[15px] leading-relaxed text-foreground/90">
        {name}, aapke chune gaye cards ne apni baat keh di hai. 🌌
      </p>
      <div className="space-y-2">
        <h3 className="font-serif text-lg text-gold">The Revelations</h3>
        <CardStrip blocks={reading.blocks} />
      </div>
      {reading.blocks.map((b, i) => (
        <div key={i} className="space-y-1">
          <p className="font-semibold text-gold">{b.position ? `${b.position}: ` : ""}{b.card}</p>
          {b.frame && <p className="text-sm italic text-muted-foreground">{b.frame}</p>}
          <Markup text={b.text} />
          {b.note && <p className="text-xs italic text-gold/70">{b.note}</p>}
        </div>
      ))}
      {reading.guidance && (
        <div className="space-y-1 border-t border-border/60 pt-3">
          <h3 className="font-serif text-lg text-gold">Universe ka guidance</h3>
          <Markup text={reading.guidance} />
        </div>
      )}
      <p className="text-[15px] leading-relaxed text-foreground/90">
        Apni inner light par vishwas rakhein, {name}. The universe is always guiding you. ✨
      </p>
    </div>
  );
}

function GinniBody({ text }) {
  const safe = typeof text === "string" ? text : "";
  const paragraphs = safe.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="space-y-3">
      {paragraphs.map((para, i) => {
        const h = canonicalHeading(para);
        if (h) return <h3 key={i} className="font-serif text-lg text-gold">{h}</h3>;
        return (
          <p key={i} className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
            {renderInline(para)}
          </p>
        );
      })}
    </div>
  );
}

export default function Message({ msg, name }) {
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
        ) : msg.reading ? (
          <AuthoredReading reading={msg.reading} name={name} />
        ) : (
          <GinniBody text={msg.text} />
        )}
      </div>
    </div>
  );
}
