# Ginni Reading Agent — Revised Flow & System Prompt

Designed against the uploaded knowledge base and the four user complaints
(information overload, conflicting timelines, context mismatch, no interactivity).

> **CANONICAL ROUTING (2026-06-22, updated):** 15 fixed intents, each answered
> from ONE source file (see §4). All intents draw **one card** EXCEPT
> **Relationship — Past/Present/Future**, which draws **3 cards** (one per
> timeline). **Yes/No** has two variants off the same file: *with guidance*
> (verdict + guidance line) and *direct* (verdict only). **Daily** has no valid
> source file yet (legacy `.doc`) so it falls back to Universe Guidance until
> re-saved as `.docx`.
>
> **Implemented in this build (deterministic, zero-LLM grounding):**
> - `app/public/ginni-kb/*.json` — one file per source doc (card → verbatim text),
>   plus `index.json` (canonical 78-card deck + per-topic coverage). Note: there is
>   no `daily.json` (source still legacy `.doc`); Yes/No Direct and Yes/No with
>   Guidance both read `yes_no.json`.
> - `app/src/lib/readingEngine.js` — the 15-intent catalogue `TOPICS` (each with
>   `file`, `count`, `mode`), plus: `classifyTopic(text)` (free-text question →
>   intent key), `cardCountFor(key)`, `getReadingByCard(topic, card)` and
>   `getReading(topic, n)`. Resolves intent → source file, applies the render mode
>   (Yes/No verdict vs verdict+guidance), and falls back to Universe Guidance for
>   any missing `{intent, card}` or missing file. No LLM call → hallucination is
>   structurally impossible.
> - `app/src/components/ReadingFlow.jsx` — the production home: a **free-text
>   input** (no pre-set prompt buttons) → `classifyTopic` → draw via `CardPicker`
>   (1 card, or 3 for Relationship) → grounded reveal. Reuses the daily gate +
>   premium/subscription logic. Mounted by `App.jsx`.
> - `app/public/ginni-reading-demo.html` — standalone number-pick demo, updated to
>   the full 15 intents incl. the 3-card Relationship and Yes/No verdict modes
>   (open `/ginni-reading-demo.html` under `npm run dev`). `ReadingFlow.jsx` remains
>   the production source of truth (free-text + visual draw); the demo is the
>   number-pick illustration of the same engine.

## How each complaint is fixed

| Complaint | Fix in this design |
|---|---|
| Information overload | One card for every intent (short, focused reading). Relationship is the single deliberate 3-card exception. |
| Conflicting logic (3 timelines) | Each single-card intent gives exactly one answer/timeline. Only Relationship draws 3 cards, and those map cleanly to Past/Present/Future positions. |
| Context mismatch (daily → PPF) | The typed question is classified to one intent first; Past/Present/Future is never forced — it applies only to the explicit Relationship intent. |
| No interactivity | The user types their question, then draws face-down card(s) from the shuffled deck (`CardPicker`) before the reveal. |

---

## 1. Revised architecture — 2-step flow

> **Note on delivery:** the **live app** uses a *free-text* home → `classifyTopic`
> → a *visual* `CardPicker` draw (1 card, or 3 for Relationship). The number-pick
> flow drawn below is the equivalent interaction used by the optional LLM prompt
> (§2) and the standalone demo — same 2-step shape, same card mapping (§3).

```
┌─ STEP 1 · ASK & DRAW ───────────────────────────────┐
│ • Greet, capture the ONE topic the user wants        │
│   (classify into a single category — never multiple).│
│ • "Maine deck shuffle karke 78 cards face-down spread│
│    kar diye hain. 1 se 78 ke beech ek number chuniye."│
│ • PAUSE. Reveal nothing. Wait for the user's number. │
└──────────────────────────────────────────────────────┘
                      │  user replies "47"
                      ▼
┌─ STEP 2 · REVEAL ───────────────────────────────────┐
│ • Map number → card (fixed 78-card order).           │
│ • Retrieve THAT card's entry for THAT topic from the │
│   knowledge base (one document = one topic).         │
│ • Output a concise 1-card reading + the card's        │
│   Guidance line, in the user's language.             │
└──────────────────────────────────────────────────────┘
```

No third step, no follow-up spread. If the user wants another area, that's a
fresh Step 1 → Step 2 cycle (new draw).

---

## 2. Updated system prompt (paste-ready)

> You are **Ginni** — a warm, dignified, members-only private tarot counsel. You
> give elegant, **concise** readings, by default in **Hinglish** (Roman-script
> Hindi blended with English), and in pure English or Hindi only if the querent
> asks or the retrieved text is in that language. Address the querent respectfully
> by name.
>
> **ABSOLUTE RULES**
>
> 1. **ONE CARD per intent — except Relationship.** Every intent draws exactly
>    one card, EXCEPT **Relationship — Past/Present/Future**, which draws **three**
>    (one card each for Past, Present, Future). Never use 5-card or Celtic Cross
>    spreads. For any single-card intent, if the querent asks for "more cards,"
>    gently say it is a single focused card and continue with one.
> 2. **INTERACTIVE DRAW — TWO STEPS, ALWAYS PAUSE.**
>    - *Step 1 (Ask & Draw):* Greet, confirm the ONE intent, then say the deck is
>      shuffled and spread face-down and ask them to pick a number **between 1 and
>      78** (for **Relationship**, ask for **three** numbers). **STOP. Reveal
>      nothing. Wait for their number(s).**
>    - *Step 2 (Reveal):* Map each number to its card and reveal the reading for
>      that card in that intent only (Relationship → Past / Present / Future).
> 3. **STRICTLY GROUNDED — ZERO HALLUCINATION.** Use only the interpretation text
>    provided from the knowledge base for the chosen {topic, card}. Never invent
>    meanings and never use traditional/outside tarot knowledge. If no entry
>    exists for that {topic, card}, fall back to that card's **Universe Guidance**
>    entry; if still none, briefly say the reading isn't available for that
>    combination and invite another draw.
> 4. **SINGULAR ANSWER.** For timing ("kab…") or yes/no questions, give exactly
>    **one** timeline or **one** verdict from the single card — never multiple or
>    conflicting timelines.
> 5. **CONCISE.** A short, warm opening line with the querent's name; the card
>    revealed; the topic-specific interpretation as written; and the card's
>    Guidance line. No extra sections, no padded summaries.
> 6. **NO FORCED FRAMEWORKS.** Never wrap a simple or daily question ("aaj ka din
>    kaisa hoga") in Past/Present/Future. Past/Present/Future applies only to the
>    **Relationship** intent (its 3-card spread); every other intent answers its
>    own question directly with one card.
>
> **INTENTS (pick exactly one — the canonical 15 are in §4):** Yes/No with
> Guidance, Yes/No Direct, Daily, Union, Third-Party Resolution, Marriage, Life
> Partner, Baby, Soulmate, Partner's Current Feelings, Spiritual Journey, Monthly
> Prediction, Universe Guidance, Partner's Action, and Relationship —
> Past/Present/Future (the only 3-card intent).
>
> **OUTPUT FORMAT**
> - 1–2 line warm opening using the querent's name.
> - `Aapka card: <Card Name>`
> - The exact topic interpretation for that card in the querent's language
>   (default Hinglish), copied faithfully from the knowledge base. You may trim
>   for length but must **never** change the meaning, the timeline, or the core
>   wording.
> - End with the card's **Guidance / Universe Guidance** line.
> - **Monthly only:** present *Month · Career · Love · Health · Studies ·
>   Guidance* (+ lucky number, lucky colour) exactly as provided.
> - **Relationship only:** three cards labelled **Past / Present / Future**, each
>   with its own card's paragraph.
> - **Yes/No:** *with guidance* = verdict + guidance line; *direct* = verdict only
>   (YES / NO / MAYBE–WAIT).
>
> **NEVER:** reveal the card(s) before the querent picks; output more cards than
> the intent calls for (one, or three for Relationship); give conflicting
> timelines for a single-card intent; add meanings not present in the source text.

---

## 3. Number → card mapping (fixed 78-card order)

The agent assigns the picked number to a card by this canonical order (Major
Arcana first, then Wands, Cups, Swords, Pentacles — the same order the documents
are written in):

- **1–22 Major Arcana:** 1 The Fool · 2 The Magician · 3 The High Priestess · 4
  The Empress · 5 The Emperor · 6 The Hierophant · 7 The Lovers · 8 The Chariot ·
  9 Strength · 10 The Hermit · 11 Wheel of Fortune · 12 Justice · 13 The Hanged
  Man · 14 Death · 15 Temperance · 16 The Devil · 17 The Tower · 18 The Star · 19
  The Moon · 20 The Sun · 21 Judgement · 22 The World
- **23–36 Wands:** Ace → Ten, Page, Knight, Queen, King
- **37–50 Cups:** Ace → Ten, Page, Knight, Queen, King
- **51–64 Swords:** Ace → Ten, Page, Knight, Queen, King
- **65–78 Pentacles:** Ace → Ten, Page, Knight, Queen, King

> **Implementation note:** this 78-card list is the single source of truth in code
> (`DECK` in `readingEngine.js`); card names are looked up inside each intent's KB
> file. Both Yes/No files parse to full 78/78 coverage; other files range 64–77/78
> (per-topic counts are in `index.json`). Any missing `{intent, card}` falls back
> to Universe Guidance, so a gap never produces a wrong or empty reading.

---

## 4. Canonical 15-intent mapping

| # | Intent | Spread | KB key | Source document |
|---|---|---|---|---|
| 1 | Yes/No with Guidance | 1 card | `yes_no_guidance` | `78 CARDS YES NO NEW.WITH GUIDIANCE.docx` |
| 2 | Yes/No Direct (verdict only) | 1 card | `yes_no_direct` | `78 CARDS YES NO NEW_.docx` (same content; rendered verdict-only) |
| 3 | Daily Reading | 1 card | `daily` | `Aapka aaj ka din kaisa hoga.docx` ⚠ legacy `.doc` — not yet ingestible; falls back to Universe Guidance |
| 4 | Union Timing | 1 card | `union` | `Apka union kab hoga.docx` |
| 5 | Third-Party Resolution | 1 card | `third_party_end` | `APKI LIFE SE THIRD PARTY SITUATION KAB END HOGI.docx` |
| 6 | Marriage Timing | 1 card | `shaadi` | `Apki shaadi kab hogi.docx` |
| 7 | Life Partner Timing | 1 card | `life_partner` | `APKO APKA LIFEPARTNER KABMILEGA.docx` |
| 8 | Pregnancy/Baby Timing | 1 card | `baby` | `APKO BABY KAB HOGA.docx` |
| 9 | Soulmate Timing | 1 card | `soulmate` | `APKO SOULMATE KAB MILEGA.docx` |
| 10 | Partner's Current Feelings | 1 card | `partner_feelings` | `Partner Current Feelings … (Final Draft).docx` |
| 11 | Spiritual Journey | 1 card | `connection` | `spiritual journey of all cards done.docx` |
| 12 | Monthly Prediction | 1 card | `monthly` | `This month for you all language done.docx` |
| 13 | Universe Guidance | 1 card | `universe_guidance` | `universe guidance.docx` |
| 14 | Partner's Action | 1 card | `partner_action` | `your partner action.done.docx` |
| 15 | Relationship Dynamics (Past/Present/Future) | **3 cards** | `relationship_ppf` | `your relationship past present future.docx` |

---

## 5. Integration notes

- **Implemented as deterministic retrieval — no LLM.** The live app never calls a
  model. `readingEngine.js` resolves intent → source file (§4), maps the drawn
  card to its KB entry, applies the render mode, and falls back to Universe
  Guidance for any gap — so "zero hallucination" is guaranteed by construction,
  not by a prompt.
- **Where it lives:** `App.jsx` → `ReadingFlow.jsx` (free-text home) → `CardPicker`
  (visual draw of 1 card, or 3 for Relationship) → `readingEngine`. The old LLM
  path (`tarot-chat`, `buildReading`, `ginniClient`, `demoReading`) was removed in
  this build; restore from git only if you deliberately want an LLM variant.
- **Optional LLM variant:** §2 is a paste-ready system prompt for that case. Inject
  the §4 file's card entry as a `{{KB_ENTRY}}` placeholder the model must reproduce
  verbatim, and use the number-pick interaction (§1/§3) since a model can't render
  the visual draw.
- **Languages:** Hinglish default; English/Hindi only where the source document
  actually contains them (Monthly + timing files do; some are Hinglish-only).
