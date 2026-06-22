import React, { useEffect, useRef, useState } from "react";
import MoonLogo from "./MoonLogo";
import StarField from "./StarField";
import Message from "./Message";
import CardPicker from "./CardPicker";
import SubscriptionModal from "./SubscriptionModal";
import { getReadingByCard, classifyTopic, cardCountFor, TOPICS, LANGUAGES } from "../lib/readingEngine";
import { startSubscription } from "../lib/razorpay";
import { gateReading } from "../lib/serverGate";
import { ensureSession, restoreEntitlement } from "../lib/auth";
import {
  canAsk, recordAsk, remaining, isPremium, grantPremium, premiumDaysLeft,
  setPremiumUntil, syncFromServer, markLimitReached, todayLocal,
} from "../lib/rateLimit";

export default function ReadingFlow({ name, onChangeIdentity }) {
  const [messages, setMessages] = useState([
    { role: "ginni", text: `Namaste ${name}. 🌌 Apne dil ka sawaal likhiye — main deck shuffle karke aapke liye ek card nikalungi.` },
  ]);
  const [picker, setPicker] = useState(null); // { topicKey, label }
  const [busy, setBusy] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [premium, setPremiumState] = useState(isPremium());
  const [subscribing, setSubscribing] = useState(false);
  const [subError, setSubError] = useState("");
  const [q, setQ] = useState("");
  const [lang, setLang] = useState(() => localStorage.getItem("ginni_lang") || "hinglish");
  const chooseLang = (id) => { setLang(id); localStorage.setItem("ginni_lang", id); };
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, picker]);

  // Sign in (anonymous) + restore Premium across devices after login.
  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureSession();
      const until = await restoreEntitlement();
      if (alive && until) { setPremiumUntil(until); setPremiumState(isPremium()); }
    })();
    return () => { alive = false; };
  }, []);

  const refreshAccess = async () => {
    const until = await restoreEntitlement();
    if (until) setPremiumUntil(until);
    setPremiumState(isPremium());
    return isPremium();
  };

  // User types a free-text question → classify to one topic → draw one card.
  const askFree = () => {
    const text = q.trim();
    if (!text || busy || picker) return;
    if (!canAsk()) { setShowPlans(true); return; }
    setQ("");
    const topicKey = classifyTopic(text);
    setPicker({ topicKey, label: text, count: cardCountFor(topicKey) });
  };

  // Click an intent chip → draw for that intent directly (no typing needed).
  const pickIntent = (t) => {
    if (busy || picker) return;
    if (!canAsk()) { setShowPlans(true); return; }
    setPicker({ topicKey: t.key, label: t.label, count: t.count || 1 });
  };

  // One card drawn → grounded reading from the knowledge base.
  const onPicked = async (cards) => {
    const topic = picker;
    setPicker(null);
    const drawn = (cards || []).map((c) => c.name);
    setMessages((m) => [...m, { role: "user", text: topic.label }, { role: "ginni", pending: true, count: drawn.length || 1 }]);
    setBusy(true);
    const replaceLast = (msg) => setMessages((m) => { const n = [...m]; n[n.length - 1] = msg; return n; });
    let hitLimit = false;
    try {
      const gate = await gateReading(todayLocal());
      if (gate.unconfigured) {
        if (!canAsk()) { hitLimit = true; markLimitReached(); }
      } else if (gate.allowed === false) {
        hitLimit = true; syncFromServer(gate); markLimitReached();
      }
      if (hitLimit) {
        replaceLast({ role: "ginni", text: `${name}, aaj ki readings poori ho gayi hain. 30 days full access ke saath unlimited guidance paayiye. 🌙` });
      } else {
        if (gate.premiumUntil) setPremiumUntil(gate.premiumUntil);
        let reading, cardObjs;
        if ((topic.count || 1) >= 3) {
          // Relationship: 3-card Past / Present / Future, each from the doc.
          const labels = ["Past", "Present", "Future"];
          const parts = [];
          cardObjs = [];
          for (let i = 0; i < drawn.length; i++) {
            const r = await getReadingByCard(topic.topicKey, drawn[i], lang);
            parts.push(`${labels[i] || "Card " + (i + 1)} — ${drawn[i]}\n${r.text}`);
            cardObjs.push({ card: drawn[i], position: labels[i] || "" });
          }
          reading = parts.join("\n\n");
        } else {
          const { card: cname, text, fallback } = await getReadingByCard(topic.topicKey, drawn[0], lang);
          const note = fallback ? "\n\n— (Universe Guidance)" : "";
          reading = `${text}${note}`;
          cardObjs = [{ card: cname, position: cname }];
        }
        if (gate.unconfigured) recordAsk();
        else if (typeof gate.remaining === "number" || gate.premiumUntil) syncFromServer(gate);
        // Card image(s) via `cards`, reading text via `text` (GinniBody).
        replaceLast({ role: "ginni", cards: cardObjs, text: reading });
      }
    } catch (e) {
      replaceLast({ role: "ginni", text: `Kshama kijiye, ${name} — thodi der baad phir poochhiye. 🌙` });
    } finally {
      setBusy(false);
      setPremiumState(isPremium());
      if (hitLimit || (!isPremium() && remaining() === 0)) setTimeout(() => setShowPlans(true), 700);
    }
  };

  const activatePremium = (until) => {
    if (until) setPremiumUntil(until); else grantPremium();
    setPremiumState(true); setShowPlans(false); setSubError("");
  };
  const handleSubscribe = async () => {
    if (subscribing) return;
    setSubError(""); setSubscribing(true);
    try {
      const res = await startSubscription({ name });
      if (res.success) activatePremium(res.premiumUntil);
      else if (res.incubated) activatePremium();
    } catch (e) { setSubError("Subscription could not be completed. Please try again."); }
    finally { setSubscribing(false); }
  };

  const left = remaining();
  const daysLeft = premiumDaysLeft();

  return (
    <div className="relative flex h-screen flex-col">
      <StarField count={28} />

      <header className="relative z-10 flex items-center justify-between gap-2 border-b border-border px-4 py-3 backdrop-blur sm:px-5">
        <div className="flex items-center gap-3">
          <MoonLogo size={40} />
          <div>
            <div className="font-serif text-xl text-gold">Ginni</div>
            <div className="text-xs text-muted-foreground">In session · The deck is prepared ✨</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center rounded-full border border-border bg-secondary/50 p-0.5">
            {LANGUAGES.map((l) => (
              <button key={l.id} onClick={() => chooseLang(l.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] transition ${lang === l.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {l.label}
              </button>
            ))}
          </div>
          <button onClick={onChangeIdentity} className="hidden text-muted-foreground transition hover:text-foreground sm:inline">Change identity</button>
          <button onClick={() => setShowPlans(true)}
            className="rounded-full bg-gold-grad px-3 py-1.5 text-[12px] font-semibold text-primary-foreground shadow-gold transition hover:brightness-105">
            {premium ? `✦ ${daysLeft}d left` : "👑 Subscribe"}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((m, i) => <Message key={i} msg={m} name={name} />)}

          <p className="text-center text-xs text-muted-foreground/60">
            {premium ? `Premium access · ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`
              : left > 0 ? `${left} free reading${left === 1 ? "" : "s"} remaining today`
              : "Daily limit reached — unlock 30 days of full access"}
          </p>
          <div ref={endRef} />
        </div>
      </main>

      <div className="relative z-10 border-t border-border px-4 pt-2 pb-3 backdrop-blur">
        {/* 15 intent chips — tap one to draw directly */}
        <div className="no-scrollbar mx-auto mb-2 flex max-w-3xl gap-2 overflow-x-auto pb-1">
          {TOPICS.map((t) => (
            <button key={t.key} onClick={() => pickIntent(t)} disabled={busy || !!picker}
              className="shrink-0 whitespace-nowrap rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-[12px] text-foreground/90 transition hover:border-gold/40 disabled:opacity-40">
              {t.label}
            </button>
          ))}
        </div>
        <div className="mx-auto flex max-w-3xl gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") askFree(); }}
            placeholder="Apna sawaal likhiye… (e.g. meri shaadi kab hogi)"
            disabled={busy || !!picker}
            className="flex-1 rounded-full border border-border bg-input/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold/60 disabled:opacity-50"
          />
          <button onClick={askFree} disabled={busy || !!picker || !q.trim()}
            className="rounded-full bg-gold-grad px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold transition hover:brightness-105 disabled:opacity-50">
            Draw
          </button>
        </div>
      </div>

      <CardPicker open={!!picker} count={picker?.count || 1} onComplete={onPicked} onCancel={() => setPicker(null)} />

      <SubscriptionModal
        open={showPlans} premium={premium} daysLeft={daysLeft} busy={subscribing} error={subError}
        onClose={() => setShowPlans(false)} onSubscribe={handleSubscribe} onSignedIn={refreshAccess}
      />
    </div>
  );
}
