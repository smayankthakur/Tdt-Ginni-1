# Fix "can't send verification code" — Custom SMTP (Resend free tier)

Your Supabase `POST /auth/v1/otp` was timing out (504) because the built-in email
service isn't delivering. Plug in a real SMTP provider and codes send in seconds.
Resend's free tier (~3,000 emails/month, 100/day) is plenty to start.

## A. Create a Resend account + API key (2 min)
1. Sign up at https://resend.com → verify your account.
2. **API Keys** → **Create API Key** → name it `ginni` → copy the key
   (`re_xxxxxxxxxxxxxxxx`). You'll paste it as the SMTP **password**.

> Sender address:
> - **Fastest (no domain):** use `onboarding@resend.dev` as the From address —
>   works immediately for testing.
> - **Production (recommended):** Resend → **Domains** → add your domain → add the
>   shown DNS records (SPF/DKIM) → wait for "Verified", then use
>   `noreply@yourdomain.com`. Better deliverability + no Resend branding.

## B. Turn on Custom SMTP in Supabase (2 min)
Supabase Dashboard → **Authentication → Emails → SMTP Settings** → **Enable Custom SMTP**, then paste:

```
Host:            smtp.resend.com
Port:            465
Username:        resend
Password:        re_xxxxxxxxxxxxxxxx        ← your Resend API key
Sender email:    onboarding@resend.dev      ← or noreply@yourdomain.com once verified
Sender name:     Ginni Ki Baatein
```
(If 465 is blocked on your network, use Port **587**.) Click **Save**.

Then **Authentication → Rate Limits** → raise "Emails per hour" (e.g. 30–100).

## C. Make it send a 6-digit CODE (not a link)
Authentication → **Email Templates** → edit **Magic Link** AND **Confirm signup**:
```
Subject: Your Ginni Ki Baatein code
Body:    Your verification code is: {{ .Token }}
```

## D. One-step sign-in
Authentication → **Providers → Email** → turn **OFF "Confirm email"** (so the OTP
logs the user in directly).

## E. URL allowlist (so the latest build's redirect is accepted)
Authentication → **URL Configuration**:
- **Site URL:** `https://tdt-ginni-1.vercel.app`
- **Redirect URLs:** add `https://tdt-ginni-1.vercel.app`,
  `https://tdt-ginni-1.vercel.app/*`, `http://localhost:5173`

## F. Test
- Subscribe modal → enter email → **Send code** → a 6-digit code should arrive in
  seconds → enter it → "Signed in ✨".
- Or verify the API directly in the browser console:
  ```js
  fetch("https://agwpfisykktphrrmnnzu.supabase.co/auth/v1/otp", {
    method: "POST",
    headers: { apikey: "<your VITE_SUPABASE_ANON_KEY>", "Content-Type": "application/json" },
    body: JSON.stringify({ email: "you@email.com", create_user: true }),
  }).then(r => r.json()).then(console.log);
  ```
  A working setup returns **200 `{}`** quickly (no 504, no 35s hang).

## Reminder (separate blockers for paid subscriptions)
- Re-deploy the edge functions under their EXACT names: `reading-gate`,
  `create-razorpay-subscription`, `verify-razorpay-payment`, `razorpay-webhook`
  (your dashboard currently shows `dynamic-endpoint` / `rapid-function` /
  `swift-action` — those won't be called by the app).
- Add the `RAZORPAY_WEBHOOK_SECRET` secret in Supabase.
