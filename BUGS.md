# Ginni Ki Baatein — bug list & fixes

## Subscription function review — 2026-06-21

Live target analysed: https://tdt-ginni-1.vercel.app/ (project ref
`agwpfisykktphrrmnnzu`). Findings verified in-browser against the deployed build
plus a full read of the source chain (`razorpay.js`, `SubscriptionModal.jsx`,
`Chat.jsx`, `serverGate.js`, and the four edge functions).

### CRITICAL

**1. CORS `ALLOWED_ORIGIN` mismatch blocks every edge-function call.**
`ALLOWED_ORIGIN` is set (as a Supabase secret) to a value that is **not**
`https://tdt-ginni-1.vercel.app` and not `*`. Because it is one project-wide
secret, it breaks CORS for *all* functions.

- Evidence: the `OPTIONS` preflight to `create-razorpay-subscription` returns
  `200`, but the browser then refuses to send the `POST`. A direct call to
  `create-razorpay-subscription`, `reading-gate`, and `tarot-chat` all fail
  identically with `TypeError: Failed to fetch`.
- Impact: this is the reported "Subscribe button launches nothing" — the
  frontend loads the Razorpay SDK, calls `create-razorpay-subscription`, the call
  is CORS-blocked → throws → checkout never opens → generic error shown.
- Fix (no redeploy needed; secrets apply on next invocation):
  ```
  npx supabase secrets set ALLOWED_ORIGIN=https://tdt-ginni-1.vercel.app --project-ref agwpfisykktphrrmnnzu
  ```
  Note: this is a single origin, so Vercel **preview** URLs stay blocked. Use `*`
  or extend the functions to accept an allow-list if previews must work.

### HIGH

**2. Reading gate fails open → server enforcement silently bypassed.**
`gateReading()` catches the CORS failure and returns `{ unconfigured: true }`, so
the app falls back to localStorage-based limits. Readings still work, but the
3/day cap and premium are **not** server-enforced — clearing localStorage resets
the limit. Resolves once bug #1 is fixed.

**3. Anonymous subscriptions get orphaned.**
The live session is an anonymous Supabase user (`is_anonymous: true`). If a user
subscribes via the plain Subscribe button without email login,
`verify-razorpay-payment` writes `premium_until` to the anonymous `user_id` row —
lost on a new device or cleared storage. The auto-launch-after-login flow fixes
this only for the email path; the button still allows anonymous purchases.

**4. No duplicate-subscription guard.** *(fixed in code — see below)*
`create-razorpay-subscription` created a new Razorpay subscription on every click
with no check for an existing active one. Combined with auto-launch firing on
every non-premium login and a live key (`rzp_live_…`), one user could spawn
multiple billable subscriptions.

### MEDIUM

**5. Silent persistence failures.** *(fixed in code — see below)*
`verify-razorpay-payment`'s `persist()` and the webhook's `setPremium()` ran
`await fetch(...)` without checking `r.ok`. A failed upsert (missing column, RLS,
etc.) still returned `{ valid: true }` — the client showed premium but nothing was
saved server-side, so entitlement vanished on the next session/device.

**6. `tarot-chat` ↔ schema mismatch (latent).**
`tarot-chat` reads/writes `ginni_access` by `device_id`, but the table has only
`user_id` (PK) — no `device_id` column or unique constraint. Any real call would
error, and premium (written by `user_id`) wouldn't be honored there anyway.
Latent only because the frontend builds readings client-side (`buildReading`) and
never calls `tarot-chat`. If `tarot-chat` is ever wired back in, fix the schema
(add `device_id` + unique index) or re-key the function to `user_id`.

### Assessment

The subscription pipeline (create → checkout → verify → webhook → entitlement) is
logically sound, and the HMAC signature verification in
`verify-razorpay-payment` and `razorpay-webhook` is correct for Razorpay
subscriptions (`payment_id|subscription_id` and raw-body HMAC respectively). The
live blocker is purely the `ALLOWED_ORIGIN` secret.

### Code fixes applied in this round

- **#4** `create-razorpay-subscription` now reads the caller's `ginni_access`
  row and, if `premium_until` is still in the future, returns
  `{ already_active: true, premiumUntil }` instead of creating a duplicate
  subscription. `razorpay.js#startSubscription` handles that response by
  restoring premium instead of opening checkout.
- **#5** `persist()` (verify) and `setPremium()` (webhook) now check `r.ok`, log
  the status/body on failure, and `verify-razorpay-payment` returns
  `persisted: true|false` so the client can detect a save failure even on a valid
  payment.

These edge-function edits require a redeploy (`deploy-functions.bat`, which now
includes all five functions) to take effect.

---

## Previous review — card-pick flow & authored-reading rendering

Build compiles clean; reading lookup + builder unit-tested.

### Fixed in that round

1. **Authored markdown rendered literally** ✅ *(visible quality bug)*
   The authored text contains `*italic*`, and `- >` / `>` / `•` bullet markers.
   The renderer only handled `**bold**`, so readers saw raw `*new chapter*` and
   `- >` lines. `Message.jsx` now renders **bold**, *italic*, and bullet lists,
   and strips stray bullet/blockquote markers.

2. **Card-pick auto-launch could stall** ✅
   The "reveal reading" timer was scheduled in an effect whose deps changed on
   re-render, so React's cleanup sometimes cancelled it and the reading never
   appeared. The completion timer is now keyed only to the `chosen` phase (and
   the cards are captured in a ref), so it always fires ~1s after the last pick.

3. **Repetitive intro line** ✅
   Every reading opened with "Welcome, {name}…". Reworded to tie to the chosen
   cards and not repeat "Welcome" on each reading.

4. **No scroll affordance on the 78-card spread** ✅
   Added left/right gradient fades so it's clear the deck continues off-screen.

### Known / by design (not bugs)

- **Quota + subscription are client-side** now that readings are local and
  deterministic (no LLM call to enforce against). The Supabase `tarot-chat`
  enforcement only applies if you route readings back through the LLM. For a paid
  product, gate the reading behind a server check keyed on device/auth.
- **Section 8 (this month) English/Hindi** are irregular in the source, so the
  language toggle falls back to Hinglish there. Sections 1–5 have all three.
- **~6 of 624 authored entries** had irregular source formatting and fall back to
  the deterministic generic note (e.g. The Chariot in "life partner", Nine of
  Wands in "this month").
- **Unused LLM code** (`lib/ginniClient.js`, `lib/demoReading.js`,
  `functions/tarot-chat`) is retained as an optional path; the app no longer
  calls it for readings.
- **Preview uses the Tailwind Play CDN** — intentional for the zero-install demo
  file; the real `app/` build compiles Tailwind via Vite.

### Verified working

- Shuffle → spread (78 face-down) → pick N → auto-reveal, with the deck
  re-shuffled each open (always different, unique cards), never revealing faces
  during selection.
- 78-card deck, 0 reversed; card images resolve; image/offline fallbacks intact.
- App + edge functions compile; reading builder returns correct text in all three
  languages plus the generic fallback.
