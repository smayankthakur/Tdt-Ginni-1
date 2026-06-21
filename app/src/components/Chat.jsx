import React, { useEffect, useRef, useState } from "react";
import MoonLogo from "./MoonLogo";
import StarField from "./StarField";
import Message from "./Message";
import Composer from "./Composer";
import SubscriptionModal from "./SubscriptionModal";
import CardPicker from "./CardPicker";
import { welcomeMessage, SPREADS, LANGS, typeForQuestion } from "../data/tarot";
import { buildReading } from "../lib/readingBuilder";
import { startSubscription } from "../lib/razorpay";
import {
  canAsk, recordAsk, remaining, isPremium, grantPremium, premiumDaysLeft, setPremiumUntil,
} from "../lib/rateLimit";

const STARTERS = [
  "Aapki shaadi kab hogi",
  "Aapko life partner kab milega",
  "Partner current feelings",
  "This month for you",
];

export default function Chat({ name, onChangeIdentity }) {
  const [messages, setMessages] = useState([{ role: "ginni", text: welcomeMessage(name) }]);
  const [spread, setSpread] = useState(3);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState(null); // { question, type, count, positions }
  const [showPlans, setShowPlans] = useState(false);
  const [locked, setLocked] = useState(!canAsk());
  const [premium, setPremiumState] = useState(isPremium());
  const [subscribing, setSubscribing] = useState(false);
  const [subError, setSubError] = useState("");
  const [lang, setLang] = useState(localStorage.getItem("ginni_lang") || "hinglish");
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, picker]);
  const chooseLang = (id) => { setLang(id); localStorage.setItem("ginni_lang", id); };

  // Step 1: question chosen -> open the interactive card picker.
  const ask = (question, type) => {
    if (busy || picker) return;
    if (!canAsk()) { setLocked(true); setShowPlans(true); return; }
    const def = SPREADS[spread] || SPREADS[3];
    setPicker({ question, type: type ?? typeForQuestion(question), count: def.count, positions: def.positions });
  };

  // Step 2: user picked the cards -> reveal the reading.
  const onPicked = (cards) => {
    const { question, type, positions } = picker;
    setPicker(null);
    setMessages((m) => [...m, { role: "user", text: question }, { role: "ginni", pending: true, count: cards.length }]);
    setBusy(true);
    setTimeout(() => {
      try {
        // thread the user's `question` through so detectType + guidanceFor can use it
        const reading = buildReading({ type, cards, positions, lang, name, question });
        recordAsk();
        setMessages((m) => { const n = [...m]; n[n.length - 1] = { role: "ginni", reading }; return n; });
      } catch (e) {
        setMessages((m) => { const n = [...m]; n[n.length - 1] = { role: "ginni", text: `Kshama kijiye, ${name} — thodi der baad phir poochhiye. 🌙` }; return n; });
      } finally {
        setBusy(false);
        setLocked(!canAsk());
        setPremiumState(isPremium());
        if (!isPremium() && remaining() === 0) setTimeout(() => setShowPlans(true), 700);
      }
    }, 650);
  };

  const activatePremium = (until) => {
    if (until) setPremiumUntil(until); else grantPremium();
    setPremiumState(true); setLocked(false); setShowPlans(false); setSubError("");
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
          <div className="hidden items-center rounded-full border border-border bg-secondary/50 p-0.5 sm:flex">
            {LANGS.map((l) => (
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

          {messages.length === 1 && (
            <div className="mt-1 gx-fade-up">
              <div className="mb-2 text-[11px] tracking-[0.2em] text-muted-foreground">A STARTING POINT</div>
              <div className="grid gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => ask(s, typeForQuestion(s))} disabled={locked || busy || !!picker}
                    className="rounded-2xl border border-border bg-secondary/40 px-4 py-2.5 text-left text-sm text-foreground/90 transition hover:border-gold/40 disabled:opacity-40">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground/60">
            {premium ? `Premium access · ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`
              : left > 0 ? `${left} free reading${left === 1 ? "" : "s"} remaining today`
              : "Daily limit reached — unlock 30 days of full access"}
          </p>
          <div ref={endRef} />
        </div>
      </main>

      <Composer spread={spread} setSpread={setSpread} onSend={ask} locked={locked || busy || !!picker} />

      <CardPicker
        open={!!picker}
        count={picker?.count || 3}
        onComplete={onPicked}
        onCancel={() => setPicker(null)}
      />

      <SubscriptionModal
        open={showPlans} premium={premium} daysLeft={daysLeft} busy={subscribing} error={subError}
        onClose={() => setShowPlans(false)} onSubscribe={handleSubscribe}
      />
    </div>
  );
}
