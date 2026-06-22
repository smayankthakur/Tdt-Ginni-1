# Ginni — Code Map (current state)

One mental model: **type a question → it's routed to ONE of 15 intents → you draw
card(s) → the reading text is pulled VERBATIM from a JSON file. There is no AI/LLM
in the reading path.** Everything below supports that.

## The reading flow (active path)

```
App.jsx
 └─ Onboarding.jsx        → asks the user's name (first screen)
 └─ ReadingFlow.jsx       → THE home screen. Free-text box → classifyTopic() →
                            CardPicker draw → shows the grounded reading.
      ├─ lib/readingEngine.js   → the brain. 15-intent catalogue (TOPICS),
      │                           classifyTopic(text)→intent, getReadingByCard(),
      │                           reads /public/ginni-kb/*.json, Universe-Guidance
      │                           fallback. NO LLM.
      ├─ CardPicker.jsx + CardShuffle.jsx → the shuffle + face-down card draw
      │                           (1 card, or 3 for Relationship). Uses DECK from
      │                           data/tarot.js.
      ├─ Message.jsx (+ CardChip.jsx) → renders each chat bubble / reading + card image
      ├─ StarField.jsx, MoonLogo.jsx  → visual chrome only
      └─ SubscriptionModal.jsx        → premium upsell: email OTP sign-in + Razorpay
```

## Knowledge base (the readings themselves)

- `public/ginni-kb/*.json` — 13 topic files (card → exact text) + `index.json`
  (the 78-card deck order + per-topic coverage). Parsed from your uploaded `.docx`.
  This is the single source of all reading text.

## Gating / auth / payments (support libs)

- `lib/rateLimit.js` — local daily-limit counter, device id, premium state (localStorage).
- `lib/serverGate.js` — calls the `reading-gate` function for the authoritative daily limit.
- `lib/auth.js` + `lib/supabase.js` — Supabase anonymous + email-OTP sign-in.
- `lib/razorpay.js` — `startSubscription()` → calls the subscription functions + opens Razorpay checkout.

## Edge functions (Supabase, project `agwpfisykktphrrmnnzu`)

| Function | Used by the app? | Purpose |
|---|---|---|
| `reading-gate` | ✅ yes (serverGate) | server-side daily limit + premium check |
| `create-razorpay-subscription` | ✅ yes (razorpay.js) | creates a Razorpay subscription |
| `verify-razorpay-payment` | ✅ yes (razorpay.js) | verifies payment signature, stores premium |
| `razorpay-webhook` | ✅ yes (Razorpay → server) | extends premium on renewals |
| `tarot-chat` | ❌ **NO — legacy** | old LLM reading path; deployed but the app never calls it |

## Safe to ignore (dead weight currently on disk)

- `src/data/meanings.js`, `src/data/readings.js` — not imported anywhere.
- `tarot-chat` function — superseded by the deterministic engine; unused by the app.
- Docs: `READING-AGENT-PROMPT.md` (design spec), `BUGS.md`, `DEPLOY.md`,
  `SMTP-SETUP.md` — reference only, not code.

## Scripts

- `deploy-functions.bat` — deploys all 5 edge functions.
- `check-functions.bat` — health/secret check of the functions.

## The one rule to remember

Reading text is **never generated** — it's looked up verbatim from
`ginni-kb/*.json` by `{intent, card}`. If a reading looks wrong, the fix is in the
JSON (or the source `.docx`), not in code.
