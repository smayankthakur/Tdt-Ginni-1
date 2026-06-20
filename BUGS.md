# Ginni Ki Baatein replica — bug list & fixes

Status after the "fix all bugs" pass. Build compiles clean; card logic and
fallbacks are tested.

## High — FIXED

1. **Quota & subscription now enforced server-side.** ✅
   Added `app/supabase/schema.sql` (`ginni_access` table, RLS on, no public
   policies). `tarot-chat` now checks the device's daily count and premium window
   **before** generating, increments usage after, and returns
   `{ premium, premiumUntil, remaining }`. On limit it returns **HTTP 429** and the
   client shows the modal. The browser can no longer grant itself access by editing
   `localStorage` (localStorage is now just a UI mirror, synced from the server).
   *Enforcement activates automatically when `SUPABASE_URL` +
   `SUPABASE_SERVICE_ROLE_KEY` are present (they are, in deployed functions).*

2. **Edge functions hardened.** ✅
   CORS origin is now configurable via `ALLOWED_ORIGIN` (default `*`, set your
   domain in prod). Per-device daily rate limiting is enforced in `tarot-chat`.
   Deploy **without** `--no-verify-jwt` so only callers with your anon key reach
   them (see README).

## Medium — FIXED

3. **Grant aligned to the real billing cycle.** ✅
   `verify-razorpay-payment` now fetches the subscription's `current_end` from
   Razorpay and sets the access window to that (falls back to +30 days), then
   persists it to `ginni_access`.

4. **Card images — own-host path made first-class.** ✅ (mitigated)
   The app already prefers `VITE_CARD_IMAGE_BASE` and only falls back to Wikimedia.
   `scripts/rename-cards.mjs` prepares your deck; README documents hosting it so
   Wikimedia is just a safety net, not the production source.

5. **Reading layout no longer depends on exact model headings.** ✅
   `Message.jsx` now normalises headings (tolerates casing, `*` markdown, trailing
   `:`) and **guarantees** the drawn-card strip renders even if the model omits the
   "The Revelations" line or position labels.

## Low / cosmetic — FIXED

6. **Daily reset uses the user's local date** (not UTC). ✅ (`todayLocal()`), and
   the client sends `localDate` to the server so the server buckets usage the same way.

7. **Bold-prefix regex restricted** to actual position labels
   (`Past|Present|Future|Focus|Situation|Obstacle|Advice|Influences|Outcome|Card N`). ✅

8. **Inputs have `aria-label`s** (onboarding "Your name", composer "Your question"). ✅

9. **Preview uses the Tailwind Play CDN** — this is intentional: `preview/index.html`
   is a zero-install demo artifact. The real app (`app/`) compiles Tailwind via Vite
   for production. Not a runtime bug. ℹ️

## Still-true notes (by design)

- In **demo mode** (no Supabase backend configured) quota/premium fall back to
  `localStorage` so the standalone preview runs offline. Server enforcement only
  applies once the backend env is set — which is the secure production path.
- Razorpay `RAZORPAY_TOTAL_COUNT` (default 12) is the number of billing cycles on
  the subscription; the access window itself follows `current_end`.

## Verified

- App + all four edge functions are complete and well-formed; client bundle builds with no errors.
- 78-card deck, 0 reversed; card image URLs resolve; offline + error fallbacks intact.
