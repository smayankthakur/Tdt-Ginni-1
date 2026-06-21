import React, { useState } from "react";
import { supabaseEnabled, sendEmailOtp, verifyEmailOtp, currentEmail } from "../lib/auth";

// "Unlock the Wisdom of Ginni" — Razorpay checkout + optional email sign-in so a
// paying user can use Premium on any device.
export default function SubscriptionModal({
  open, onClose, onSubscribe, onSignedIn, premium, daysLeft = 0, busy = false, error = "",
  autoLaunchOnLogin = true,
}) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState("");

  if (!open) return null;

  const send = async () => {
    if (!email.trim()) return;
    setAuthBusy(true); setAuthMsg("");
    try { await sendEmailOtp(email.trim()); setSent(true); setAuthMsg("Code bhej diya — apna email check kijiye."); }
    catch (e) { setAuthMsg("Could not send code. Try again."); }
    finally { setAuthBusy(false); }
  };
  const verify = async () => {
    if (!otp.trim()) return;
    setAuthBusy(true); setAuthMsg("");
    try {
      await verifyEmailOtp(email.trim(), otp.trim());
      const e = await currentEmail();
      // Restore any existing entitlement first; onSignedIn (refreshAccess)
      // returns whether this account is already Premium.
      const alreadyPremium = onSignedIn ? await onSignedIn() : false;
      if (alreadyPremium) {
        setAuthMsg(`Signed in${e ? " as " + e : ""}. Premium restored ✨`);
      } else if (autoLaunchOnLogin && onSubscribe) {
        // Auto-launch checkout right after login so the subscription is tied to
        // this authenticated account — no second click on Subscribe needed.
        setAuthMsg(`Signed in${e ? " as " + e : ""}. Opening checkout… ✨`);
        onSubscribe();
      } else {
        setAuthMsg(`Signed in${e ? " as " + e : ""}. ✨`);
      }
    } catch (e) { setAuthMsg("Invalid or expired code."); }
    finally { setAuthBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md animate-rise rounded-3xl border border-gold/30 bg-card p-7 shadow-card">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground" aria-label="Close">✕</button>

        <div className="mb-3 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-grad text-2xl shadow-gold">👑</div>
        </div>
        <h2 className="text-center font-serif text-2xl text-gold">Unlock the Wisdom of Ginni</h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {premium ? `Your full access is active — ${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining.`
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
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">30 days full access</span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-foreground/90">
            <li>✓ Unlimited messages</li>
            <li>✓ Priority response</li>
            <li>✓ Deep spiritual insights</li>
          </ul>
        </div>

        {error && <p className="mt-3 text-center text-sm text-rose">{error}</p>}

        <button onClick={onSubscribe} disabled={premium || busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-grad py-3 font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-50">
          {premium ? `👑 Active — ${daysLeft} days left` : busy ? "Processing…" : "👑 Subscribe — Unlock 30 days"}
        </button>

        {supabaseEnabled && !premium && (
          <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-3">
            <p className="mb-2 text-center text-xs text-muted-foreground">
              Tip: sign in with email before subscribing to use Premium on any device.
            </p>
            {!sent ? (
              <div className="flex gap-2">
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@email.com"
                  className="flex-1 rounded-full border border-border bg-input/60 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold/60" />
                <button onClick={send} disabled={authBusy} className="rounded-full bg-secondary px-3 py-2 text-sm text-foreground transition hover:brightness-110 disabled:opacity-50">
                  {authBusy ? "…" : "Send code"}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" placeholder="6-digit code"
                  className="flex-1 rounded-full border border-border bg-input/60 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-gold/60" />
                <button onClick={verify} disabled={authBusy} className="rounded-full bg-gold-grad px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:brightness-105 disabled:opacity-50">
                  {authBusy ? "…" : "Verify"}
                </button>
              </div>
            )}
            {authMsg && <p className="mt-2 text-center text-xs text-muted-foreground">{authMsg}</p>}
          </div>
        )}

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Secure checkout via Razorpay • Cancel anytime
        </p>
      </div>
    </div>
  );
}
