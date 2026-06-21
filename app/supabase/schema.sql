-- Ginni Ki Baatein — per-user entitlement (Supabase Auth + server-side gating)
-- Run in the Supabase SQL editor.

create table if not exists public.ginni_access (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  premium_until  timestamptz,
  daily_date     date,
  daily_count    integer not null default 0,
  subscription_id text,
  updated_at     timestamptz not null default now()
);

alter table public.ginni_access enable row level security;

-- A signed-in user may READ their own entitlement row (so the app can restore
-- Premium on any device after login). All WRITES happen only via the edge
-- functions using the service-role key, which bypasses RLS.
drop policy if exists "own row read" on public.ginni_access;
create policy "own row read"
  on public.ginni_access for select
  using (auth.uid() = user_id);

-- Optional housekeeping: drop stale free rows.
-- delete from public.ginni_access
--   where premium_until is null and updated_at < now() - interval '90 days';
