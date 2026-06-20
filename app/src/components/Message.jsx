import React from "react";
import CardChip from "./CardChip";
import CardShuffle from "./CardShuffle";

const HEADINGS = { "the revelations": "The Revelations", "universe ka guidance": "Universe ka guidance" };
const norm = (s) => s.replace(/^#+\s*/, "").replace(/\*+/g, "").replace(/:\s*$/, "").trim();
const canonicalHeading = (s) => HEADINGS[norm(s).toLowerCase()] || null;

// inline **bold** -> gold strong
function renderBold(s) {
  return String(s).split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <strong key={i} className="text-gold">{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  );
}
function Markup({ text }) {
  const paras = String(text || "").split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/90">
          {renderBold(p)}
        </p>
      ))}
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

// Authored / generic structured reading from the local library.
function AuthoredReading({ reading, name }) {
  return (
    <div className="space-y-4">
      <p className="text-[15px] leading-relaxed text-foreground/90">
        Welcome, {name}. Ek gehri saans lijiye — cards aapke liye taiyaar hain. 🌌
      </p>
      <div className="space-y-2">
        <h3 className="font-serif text-lg text-gold">The Revelations</h3>
        <CardStrip blocks={reading.blocks} />
      </div>
      {reading.blocks.map((b, i) => (
        <div key={i} className="space-y-1">
          <p className="font-semibold text-gold">{b.position ? `${b.position}: ` : ""}{b.card}</p>
          <Markup text={b.text} />
        </div>
      ))}
      <p className="text-[15px] leading-relaxed text-foreground/90">
        Apni inner light par vishwas rakhein, {name}. The universe is always guiding you. ✨
      </p>
    </div>
  );
}

// Plain-text reading (welcome, errors, legacy LLM text).
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
            {renderBold(para)}
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
