# Ginni Ki Baatein — Replica

A faithful replica of the **Ginni Ki Baatein** private tarot counsel chatbot
(https://ginni-ki-baatein-buddy.lovable.app/). Input model: **question in → full
Hinglish reading out**.

See **[ANALYSIS.md](./ANALYSIS.md)** for the complete teardown of the original
(UX, persona, reading format, monetisation, tech stack).

## Reading content (authored, not AI)

Readings come from Ginni's **own authored library** (`combined.md`), parsed into
`app/src/data/readings.js` — verbatim, deterministic, no LLM required:

- 8 question types are fully authored, keyed per card: third-party timing, shaadi
  kab hogi, life partner kab milega, baby kab hoga, soulmate kab milega, partner
  current feelings, spiritual journey, this month for you.
- Three languages with a **Hinglish / English / हिंदी** toggle (Hinglish default).
  Sections 1–5 have all three; section 8 has Hinglish (toggle falls back to it).
- Any other question (Yes/No, free text, etc.) uses a deterministic generic
  per-card note.
- Coverage ≈ 99% of cards; the few source gaps fall back to the generic note.

Regenerate the data after editing `combined.md`:
`node scripts/parse-readings.mjs` (place `combined.md` next to the script).

Because readings are now local + deterministic, the app needs **no LLM/Supabase
to run**. The LLM edge function (`tarot-chat`) is kept in the repo but optional;
Supabase/Razorpay are only needed for real subscription billing.

## What's inside

```
ginni-replica/
├── ANALYSIS.md                       # full teardown of the original
└── app/
    ├── src/
    │   ├── App.jsx                    # onboarding ↔ chat
    │   ├── components/               # Onboarding, Chat, Composer, Message, CardChip, SubscriptionModal …
    │   ├── data/tarot.js             # 78-card deck, spreads, templates, categories, welcome
    │   └── lib/                      # ginniClient (LLM call), demoReading (offline), rateLimit
    └── supabase/functions/tarot-chat/index.ts   # server-side persona + LLM (the Ginni "brain")
```

## Run it

```bash
cd app
npm install
npm run dev          # http://localhost:5173
```

With no backend configured the app runs in **DEMO mode** — it draws real cards
and produces a structured Hinglish reading locally, so you can see the full
flow immediately.

## Wire the real LLM (the Ginni brain)

The persona and reading format live server-side in
`app/supabase/functions/tarot-chat/index.ts`, exactly like the original.

1. Create a Supabase project, run `app/supabase/schema.sql` (creates the
   `ginni_access` table used for server-side limits/subscription), then deploy:
   ```bash
   supabase functions deploy tarot-chat          # keep JWT verification ON
   supabase secrets set LOVABLE_API_KEY=...       # or OPENAI_API_KEY=...
   # optional: supabase secrets set DAILY_LIMIT=3 ALLOWED_ORIGIN=https://your-domain
   ```
   With `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` present (automatic in deployed
   functions), the **3/day limit and 30-day access are enforced server-side**.
2. Copy `app/.env.example` to `app/.env` and set `VITE_SUPABASE_URL` +
   `VITE_SUPABASE_ANON_KEY` (or `VITE_TAROT_CHAT_URL`).
3. Restart `npm run dev`. The client now draws the cards and `tarot-chat`
   interprets them in Ginni's voice.

## Use your own card images (rename script)

Drop your deck (any common naming) into a folder and run:

```bash
node scripts/rename-cards.mjs <folder>           # dry run — shows the plan
node scripts/rename-cards.mjs <folder> --apply   # rename to the-star.jpg, six-of-wands.jpg, …
node scripts/rename-cards.mjs --list             # print all 78 target slugs
```

It matches Wikimedia (`Wands06.jpg`, `RWS_Tarot_17_Star.jpg`), numbered majors,
and freeform names, and reports unmatched/missing/duplicate files. Then host that
folder and set `VITE_CARD_IMAGE_BASE` to its base URL.

## Razorpay subscription

The Subscribe button opens the **real Razorpay checkout** when configured, then
grants 30-day full access after the payment signature is verified server-side.
If not configured, it grants 30-day access directly (incubated) so nothing breaks.

1. Deploy the billing functions (keep JWT verification ON):
   ```bash
   supabase functions deploy create-razorpay-subscription
   supabase functions deploy verify-razorpay-payment
   supabase secrets set RAZORPAY_KEY_ID=rzp_xxx RAZORPAY_KEY_SECRET=xxx RAZORPAY_PLAN_ID=plan_xxx
   ```
2. In `app/.env`, set `VITE_RAZORPAY_KEY_ID` (the **public** Key ID) and your
   `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
3. **Never** put the Key Secret in `.env`/front end — only as a Supabase secret.

> Create a Razorpay Plan whose period/interval = the access you sell (e.g. monthly).
> The 30-day app access window is granted on each verified payment.

## Feature parity + customisations

- ✅ "Enter the Sanctum" onboarding (name capture)
- ✅ Personalised welcome + Ginni header ("In session · The deck is prepared")
- ✅ Category filter + question templates (all 14, across 5 categories)
- ✅ 1 / 3 / 5-card spreads with position labels and drawn-card art
- ✅ Reading format: opening → **The Revelations** → **Universe ka guidance** → closing blessing
- ✅ Design matched 1:1 to the original (CSS-variable token system)

### Customisations in this build

- **3 readings per day** on the free tier (`FREE_DAILY_LIMIT` in `lib/rateLimit.js`).
- **No reversed cards** — every card is drawn upright (`drawCards` in `data/tarot.js`).
- **Card images always load** — public-domain Rider–Waite deck from Wikimedia Commons
  by default, with a per-card fallback chain ending in an elegant text card. Set
  `VITE_CARD_IMAGE_BASE` to serve your own images (e.g. your GitHub raw URL).
- **Incubated subscription** — no real payment; the subscribe button grants every
  subscriber a fresh **30-day full-access** window (`grantPremium` in `lib/rateLimit.js`).
- **"Strategic Counsel" → "Universe ka guidance"** (client + edge-function prompt).
- **Card-shuffling motion** plays after each message while the reading is prepared
  (`components/CardShuffle.jsx`).
- **Never breaks** — an `ErrorBoundary` wraps the app, the LLM call falls back to an
  offline reading generator, empty responses are guarded, and images degrade gracefully.

## To take it to production

- To re-enable real billing, wire `create-razorpay-subscription` → checkout →
  `verify-razorpay-payment` into `SubscriptionModal` / `Chat` (currently incubated).
- Enforce the daily quota and the 30-day access window **server-side**
  (keyed on `ginni_device_id` / auth), not just in `localStorage`.
- To host your own deck, drop images at `VITE_CARD_IMAGE_BASE` named by slug
  (`the-star.jpg`, `six-of-wands.jpg`, `ace-of-cups.jpg`, …).

> For guidance purposes only 🌙
