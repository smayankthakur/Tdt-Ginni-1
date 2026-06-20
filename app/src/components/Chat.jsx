import React, { useEffect, useRef, useState } from "react";
import MoonLogo from "./MoonLogo";
import StarField from "./StarField";
import Message from "./Message";
import Composer from "./Composer";
import SubscriptionModal from "./SubscriptionModal";
import { welcomeMessage, SPREADS, drawCards } from "../data/tarot";
import { generateReading } from "../lib/ginniClient";
import { startSubscription } from "../lib/razorpay";
import {
  canAsk,
  recordAsk,
  remaining,
  isPremium,
  grantPremium,
  premiumDaysLeft,
  setPremiumUntil,
  syncFromServer,
  markLimitReached,
} from "../lib/rateLimit";

const STARTERS = [
  "Daily Illumination — what should I attend to today?",
  "Matters of the Heart — clarity on a relationship.",
  "Career Trajectory — guidance on my next move.",
  "Spiritual Alignment — what is my soul asking of me?",
];

export default function Chat({ name, onChangeIdentity }) {
  const [messages, setMessages] = useState([
    { role: "ginni", text: welcomeMessage(name) },
  ]);
  const [spread, setSpread] = useState(3);
  const [busy, setBusy] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [locked, setLocked] = useState(!canAsk());
  const [premium, setPremiumState] = useState(isPremium());
  const [subscribing, setSubscribing] = useState(false);
  const [subError, setSubError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshState = () => {
    setLocked(!canAsk());
    setPremiumState(isPremium());
  };

  const ask = async (question) => {
    if (busy) return;
    if (!canAsk()) {
      setLocked(true);
      setShowPlans(true); // auto-launch when limit already reached
      return;
    }

    const spreadDef = SPREADS[spread] || SPREADS[3];
    const { positions, count } = spreadDef;
    let cards = [];
    try {
      cards = drawCards(count);
    } catch (e) {
      cards = [{ name: "The Star" }];
    }

    setMessages((m) => [
      ...m,
      { role: "user", text: question },
      { role: "ginni", pending: true, count },
    ]);
    setBusy(true);

    const minShuffle = new Promise((r) => setTimeout(r, 1400));
    let hitLimit = false;

    try {
      const [result] = await Promise.all([
        generateReading({ name, question, positions, cards }),
        minShuffle,
      ]);

      // Server is authoritative when it returns usage; otherwise count locally.
      if (typeof result.remaining === "number" || result.premiumUntil) {
        syncFromServer(result);
      } else {
        recordAsk();
      }

      const text =
        result.reading && result.reading.trim()
          ? result.reading
          : `${name}, the cards are quiet for a moment. Thodi der baad phir poochhiye. 🌙`;
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = { role: "ginni", text, cards, positions };
        return next;
      });
    } catch (err) {
      if (err && err.code === "daily_limit") {
        hitLimit = true;
        syncFromServer(err.info || { remaining: 0 });
        markLimitReached();
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "ginni",
            text: `${name}, aaj ki readings poori ho gayi hain. 30 days full access ke saath unlimited guidance paayiye. 🌙`,
          };
          return next;
        });
      } else {
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "ginni",
            text: `Kshama kijiye, ${name} — abhi cards shaant hain. Thodi der baad phir poochhiye. 🌙`,
          };
          return next;
        });
      }
    } finally {
      setBusy(false);
      refreshState();
      if (hitLimit || (!isPremium() && remaining() === 0)) {
        setTimeout(() => setShowPlans(true), 700);
      }
    }
  };

  const activatePremium = (premiumUntil) => {
    if (premiumUntil) setPremiumUntil(premiumUntil);
    else grantPremium();
    setPremiumState(true);
    setLocked(false);
    setShowPlans(false);
    setSubError("");
  };

  const handleSubscribe = async () => {
    if (subscribing) return;
    setSubError("");
    setSubscribing(true);
    try {
      const res = await startSubscription({ name });
      if (res.success) activatePremium(res.premiumUntil);
      else if (res.incubated) activatePremium();
      else if (res.dismissed) {
        /* user closed checkout — leave modal open, no error */
      }
    } catch (e) {
      setSubError("Subscription could not be completed. Please try again.");
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setSubscribing(false);
    }
  };

  const left = remaining();
  const daysLeft = premiumDaysLeft();

  return (
    <div className="relative flex h-screen flex-col">
      <StarField count={28} />

      <header className="relative z-10 flex items-center justify-between border-b border-border px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <MoonLogo size={40} />
          <div>
            <div className="font-serif text-xl text-gold">Ginni</div>
            <div className="text-xs text-muted-foreground">In session · The deck is prepared ✨</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm sm:gap-3">
          <button
            onClick={() => setShowPlans(true)}
            className="hidden rounded-full border border-border bg-secondary/60 px-3 py-1 text-[11px] text-muted-foreground transition hover:text-foreground sm:inline-block"
          >
            ✦ {premium ? "Premium counsel" : "Standard counsel"}
          </button>
          <button
            onClick={onChangeIdentity}
            className="text-muted-foreground transition hover:text-foreground"
          >
            Change identity
          </button>
          <button
            onClick={() => setShowPlans(true)}
            className="rounded-full bg-gold-grad px-3 py-1.5 text-[12px] font-semibold text-primary-foreground shadow-gold transition hover:brightness-105"
          >
            {premium ? `✦ ${daysLeft}d left` : "👑 Subscribe"}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((m, i) => (
            <Message key={i} msg={m} />
          ))}

          {messages.length === 1 && (
            <div className="mt-1 animate-rise">
              <div className="mb-2 text-[11px] tracking-[0.2em] text-muted-foreground">
                A STARTING POINT
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    disabled={locked || busy}
                    className="rounded-2xl border border-border bg-secondary/40 px-4 py-2.5 text-left text-sm text-foreground/90 transition hover:border-gold/40 disabled:opacity-40"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground/60">
            {premium
              ? `Premium access · ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining`
              : left > 0
              ? `${left} free reading${left === 1 ? "" : "s"} remaining today`
              : "Daily limit reached — unlock 30 days of full access"}
          </p>
          <div ref={endRef} />
        </div>
      </main>

      <Composer spread={spread} setSpread={setSpread} onSend={ask} locked={locked || busy} />

      <SubscriptionModal
        open={showPlans}
        premium={premium}
        daysLeft={daysLeft}
        busy={subscribing}
        error={subError}
        onClose={() => setShowPlans(false)}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
}
