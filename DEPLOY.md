# Deploy & go live (hardened: Supabase Auth + server gating + Razorpay webhook)

> **Never commit secrets.** Only `VITE_*` values are public (they ship in the
> browser). The Razorpay **Key Secret**, **Webhook Secret**, and the Supabase
> **service-role** key are server-only — set them in Supabase, never with a
> `VITE_` prefix.

## 1. Supabase — Auth

Authentication → Providers:
- Enable **Email** (Email OTP / magic link).
- Enable **Anonymous sign-ins** (the app signs every visitor in anonymously so
  usage is tracked per account with zero friction; they can later attach an email
  to keep Premium across devices).

## 2. Supabase — Database

SQL editor → run `app/supabase/schema.sql` (creates `ginni_access` keyed on the
auth user, with RLS so a user can read only their own entitlement; all writes are
via the service role inside the edge functions).

## 3. Supabase — Edge Functions

```bash
supabase link --project-ref agwpfisykktphrrmnnzu

# user-authenticated functions (keep JWT verification ON)
supabase functions deploy reading-gate
supabase functions deploy create-razorpay-subscription
supabase functions deploy verify-razorpay-payment

# Razorpay calls this server-to-server (no Supabase JWT) → disable JWT check
supabase functions deploy razorpay-webhook --no-verify-jwt

# (tarot-chat is optional — readings are generated locally; deploy only if you
#  later switch on the LLM path)

supabase secrets set \
  RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx \
  RAZORPAY_KEY_SECRET=your_key_secret \
  RAZORPAY_PLAN_ID=plan_xxxxxxxxxxxx \
  RAZORPAY_TOTAL_COUNT=12 \
  RAZORPAY_WEBHOOK_SECRET=your_webhook_secret \
  DAILY_LIMIT=3 \
  ALLOWED_ORIGIN=https://your-vercel-domain.vercel.app
```
Do **NOT** set `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — injected automatically.

## 4. Razorpay — Webhook

Dashboard → Settings → Webhooks → add:
- URL: `https://agwpfisykktphrrmnnzu.supabase.co/functions/v1/razorpay-webhook`
- Secret: the same value you set as `RAZORPAY_WEBHOOK_SECRET`.
- Active events: `subscription.charged`, `subscription.activated`,
  `subscription.cancelled` (also fine: `subscription.completed`, `…halted`).

This is what auto-extends a user's Premium on every renewal charge.

## 5. Vercel — Frontend env (these 3 only)

```
VITE_SUPABASE_URL=https://agwpfisykktphrrmnnzu.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
```
Redeploy after adding them. Build is handled by `vercel.json`.

## How it works (hardened)

1. On load the app signs the visitor in **anonymously** (real Supabase user + JWT).
2. Before each reading the client calls **`reading-gate`** with that JWT. The
   server checks the user's daily count / Premium window in `ginni_access` and
   allows or returns **429** (then the app shows the subscribe modal). The free
   limit can no longer be bypassed from the browser.
3. **Subscribe** → `create-razorpay-subscription` tags the subscription with the
   user id → Razorpay Checkout → `verify-razorpay-payment` verifies the signature
   and writes `premium_until` for that user.
4. **Renewals**: Razorpay fires `subscription.charged` → `razorpay-webhook`
   verifies it and pushes the new `current_end` into `ginni_access` → access stays
   active without any client action.
5. **Restore across devices**: a user signs in with **email OTP** (in the
   subscribe modal). On any device, after login the app reads their `ginni_access`
   row and restores Premium. (Subscribe while signed in with email so the
   entitlement is on the email account, not the anonymous one.)

## Still good to add later
- Link an anonymous account to email automatically on first OTP (so a purchase
  made before signing in carries over) — currently advise users to sign in first.
- Rate-limit the edge functions / add abuse protection at scale.
