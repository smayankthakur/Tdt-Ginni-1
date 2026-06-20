# Ginni Ki Baatein — Complete Teardown & Replica Spec

**Live app analysed:** https://ginni-ki-baatein-buddy.lovable.app/
**Date:** 2026-06-20
**Method:** Live browser inspection (rendered DOM, network calls, JS bundle, localStorage).

---

## 1. What it is

"Ginni Ki Baatein — A Private Tarot Counsel." An exclusive, members-only **tarot chatbot** that gives **refined Hinglish readings** (Roman-script Hindi mixed with English) for matters of the heart, career, and spirit. The persona is **Ginni**, a warm, elegant female tarot reader. Positioned as premium and "strategic" ("clarity and strategic foresight").

The user asks a question → the app draws tarot cards for the chosen spread → Ginni interprets the cards in Hinglish, personalised with the user's name.

---

## 2. Tech stack (confirmed)

| Layer | What it uses |
|---|---|
| Front end | React + Tailwind SPA, built on **Lovable** (project `a56bb577-942e-40cf-bce4-ec137e428e02`) |
| Backend | **Supabase** (project `mqewouddeyyrhjotzzpj`), Edge Functions |
| LLM | Called server-side inside the `tarot-chat` edge function (model not exposed to the client) |
| Payments | **Razorpay** (subscriptions) |
| Assets | Tarot card images served from `/card_img/<Card Name>.webp` |
| Analytics | Lovable's built-in event tracking (`/__l5e/trackevents`, `~flock.js`) |

**Edge functions seen in the bundle:**

- `tarot-chat` — generates the reading (holds the system prompt server-side)
- `get-subscription-status` — returns the user's plan
- `create-razorpay-subscription`, `verify-razorpay-payment`, `razorpay-config` — billing
- `promote-admin` — admin utility

---

## 3. Screens & flow

### 3.1 Onboarding ("Enter the Sanctum")
- Crescent-moon logo in a glowing amber circle.
- Serif gold title: **"Ginni Ki Baatein"**.
- Subtitle: *"Ek private tarot counsel. Aapko kis naam se sambodhan karun?"*
- A single **"Your name"** text input.
- Gold gradient button: **"Enter the Sanctum"** (with a sparkle icon).
- Name is stored locally and used to personalise every message.

### 3.2 Chat screen
- **Header:** crescent-moon avatar, **"Ginni"**, status line *"In session · The deck is prepared ✨"*. Top-right: a **"Standard counsel"** plan badge and a **"Change identity"** button (returns to onboarding).
- **Welcome message** (personalised):
  > *"Welcome, {name}. Main Ginni hoon. Ek gehri saans lijiye, aur jab aap tayyar hon, woh sawaal poochhiye jo aapke zehan mein chal raha hai. The cards will speak with the grace it deserves. 🌌"*
- **Template / suggestion bar** — category filter chips + horizontally-scrolling question chips (see §4).
- **Spread selector:** `1 card` · `3 cards` (default) · `5 cards`, with a position hint (3 cards → *"Past · Present · Future"*).
- **Composer:** input placeholder *"Pose your question…"* (becomes *"Daily limit reached — your question will be held in reserve"* when the quota is used up) + amber send button.
- **Footer disclaimer:** *"For guidance purposes only 🌙"*.

---

## 4. Templates & categories

**Categories (filter chips):** `ALL`, `MATTERS OF THE HEART`, `BONDS & LINEAGE`, `SPIRITUAL ALIGNMENT`, `DAILY ILLUMINATION`.

**Question templates (chips):**

| Emoji | Prompt | Likely category |
|---|---|---|
| 🪄 | Yes / No reading | Daily Illumination |
| 🌅 | Aapka aaj ka din kaisa hoga | Daily Illumination |
| 💞 | Aapka union kab hoga | Matters of the Heart |
| 🚫 | Third party situation kab end hogi | Matters of the Heart |
| 💍 | Aapki shaadi kab hogi | Matters of the Heart |
| 💖 | Aapko life partner kab milega | Matters of the Heart |
| ✨ | Aapko soulmate kab milega | Matters of the Heart |
| 👶 | Aapko baby kab hoga | Bonds & Lineage |
| 💭 | Partner current feelings | Matters of the Heart |
| 🎯 | Your partner's next action | Matters of the Heart |
| 🔮 | Relationship past, present, future | Matters of the Heart |
| 🕉️ | Spiritual journey reading | Spiritual Alignment |
| 🗓️ | This month for you | Daily Illumination |
| 🌌 | Universe guidance | Spiritual Alignment |

The product is **heavily love/relationship-oriented** — the majority of templates concern unions, marriage, soulmates, and partners.

---

## 5. The reading format (reverse-engineered from a live sample)

**Sample asked:** "Will my career improve this year?" (3-card spread). Ginni returned:

1. **Opening acknowledgement** (1 short paragraph) — greets by name, signals empathy in Hinglish, frames the question.
   > *"Welcome, Aria. I sense the energy of your aspirations today. Jo baatein aapke zehan mein chal rahi hain, main unhe samajh sakti hoon. Let us seek clarity from the universe regarding your career path…"*
2. **"The Revelations"** (gold section heading) — one block **per drawn card**, each labelled with its **position + card name + card icon**, then a 3–4 sentence Hinglish interpretation that repeats the user's name:
   - *Past: The Star* — …
   - *Present: Page of Swords* — …
   - *Future: Six of Wands* — …
3. **"Strategic Counsel"** (gold heading) — a synthesis paragraph that ties the cards together and gives actionable advice.
4. **Closing blessing** (1 line) — *"Apni inner light par vishwas rakhein, Aria. The universe is always guiding you. ✨"*

**Spread → position labels**
- 1 card → a single focus card.
- 3 cards → **Past · Present · Future**.
- 5 cards → a 5-position spread (e.g. Situation · Obstacle · Advice · Influences · Outcome).

**Deck:** full 78-card Rider–Waite (Major Arcana + Wands/Cups/Swords/Pentacles). Cards are drawn at random and can appear **upright or reversed** (the bundle references `reversed` / `upright` / "ulta"). Card art is pulled from `/card_img/<name>.webp` (several files currently 404 on the live site, so the UI falls back to an icon).

**Voice characteristics**
- Hinglish: English sentence scaffolding with Hindi phrases in Roman script ("aapke zehan mein", "mehnat aur lagan ka phal", "darr ke bina embrace karein").
- Warm, reassuring, feminine verb forms.
- Repeats the querent's name for intimacy.
- Mystical-but-refined; never crude, never alarmist (even "negative" cards reframed constructively).
- Mixes an emoji or two (🌌 ✨ 🃏).

---

## 6. Monetisation & limits

**Subscription modal ("Unlock the Wisdom of Ginni — Go Premium for unlimited tarot guidance"):**

| | Free | Premium — ₹199/month |
|---|---|---|
| Messages | 1 per day* | Unlimited |
| Guidance | Basic tarot guidance | Deep spiritual insights |
| Response | — | Priority response |

*Checkout via **Razorpay**, "Cancel anytime".*

\* The marketing says "1 message per day"; the actual client counter allowed a few before locking, so the enforced number may differ.

**Rate limiting mechanism (observed in `localStorage`):**
- `ginni_device_id` — a per-device UUID (used as the server-side quota key).
- `ginni_msg_count` + `ginni_msg_date` — client-side daily counter, reset on date change.
- `ginni_name` — the chosen display name.
- Quota is enforced **both** client-side (counter) and server-side (device id), so clearing one alone won't fully bypass it on a real deployment.

---

## 7. Visual design language

- **Mood:** dark, nocturnal, luxe. Near-black background with soft **purple** radial glows and faint floating "stars".
- **Accent:** warm **amber/gold** gradient (logo, headings, primary buttons, active chips).
- **Type:** elegant **serif** for the brand name and section headings ("The Revelations", "Strategic Counsel"); clean sans-serif for body.
- **Components:** rounded pill chips, rounded message cards with a subtle purple glow under Ginni's bubbles, a circular send button.
- **Tone of copy:** ceremonial — "Sanctum", "counsel", "the deck is prepared", "for guidance purposes only".

---

## 8. How the replica is built (this project)

The `app/` folder is a **React + Vite + Tailwind** front end (Lovable-style) plus a **Supabase edge function** `tarot-chat` that holds the reconstructed Ginni system prompt and calls the LLM — mirroring the original architecture. Input model: **question in → full Hinglish reading out**. See `README.md` for setup and `app/supabase/functions/tarot-chat/index.ts` for the persona prompt.

Differences from the original (by necessity): the LLM provider is configurable (defaults to the Lovable AI Gateway, with an OpenAI fallback), and Razorpay billing is stubbed behind a clearly-marked integration point rather than wired to a live merchant account.
