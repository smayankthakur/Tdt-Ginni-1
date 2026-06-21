# Ginni Ki Baatein — bug list & fixes

Latest review covers the interactive card-pick flow and the authored-reading
rendering. Build compiles clean; reading lookup + builder unit-tested.

## Fixed in this round

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

## Known / by design (not bugs)

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

## Verified working

- Shuffle → spread (78 face-down) → pick N → auto-reveal, with the deck
  re-shuffled each open (always different, unique cards), never revealing faces
  during selection.
- 78-card deck, 0 reversed; card images resolve; image/offline fallbacks intact.
- App + edge functions compile; reading builder returns correct text in all three
  languages plus the generic fallback.
