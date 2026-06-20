import React from "react";

// "Unlock the Wisdom of Ginni". Launches Razorpay checkout when configured;
// otherwise grants a 30-day full-access window directly (incubated).
export default function SubscriptionModal({
  open, onClose, onSubscribe, premium, daysLeft = 0, busy = false, error = "",
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md animate-rise rounded-3xl border border-gold/30 bg-card p-7 shadow-card">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="mb-3 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-grad text-2xl shadow-gold">
            👑
          </div>
        </div>
        <h2 className="text-center font-serif text-2xl text-gold">Unlock the Wisdom of Ginni</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {premium
            ? `Your full access is active — ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining.`
            : "Go Premium for 30 days of unlimited tarot guidance."}
        </p>

        <div className="mt-5 rounded-2xl border border-border bg-secondary/40 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Current Plan</span>
            <span className="text-sm text-muted-foreground">{premium ? "Premium" : "Free"}</span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• 3 messages per day</li>
            <li>• Basic tarot guidance</li>
          </ul>
        </div>

        <div className="mt-3 rounded-2xl border border-gold/50 bg-gold/5 p-4 shadow-gold">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gold">✦ Premium Plan</span>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
              30 days full access
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-foreground/90">
            <li>✓ Unlimited messages</li>
            <li>✓ Priority response</li>
            <li>✓ Deep spiritual insights</li>
          </ul>
        </div>

        {error && <p className="mt-3 text-center text-sm text-rose">{error}</p>}

        <button
          onClick={onSubscribe}
          disabled={premium || busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-grad py-3 font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-50"
        >
          {premium
            ? `👑 Active — ${daysLeft} days left`
            : busy
            ? "Processing…"
            : "👑 Subscribe — Unlock 30 days"}
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Secure checkout via Razorpay • Every subscriber gets a full 30-day window.
        </p>
      </div>
    </div>
  );
}
