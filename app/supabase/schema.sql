-- Ginni Ki Baatein — server-side access control
-- Run in the Supabase SQL editor. Only the edge functions (service role) touch
-- this table; RLS is enabled with NO public policies so the browser can't read
-- or write it directly.

create table if not exists public.ginni_access (
  device_id     text primary key,
  premium_until timestamptz,
  daily_date    date,
  daily_count   integer not null default 0,
  updated_at    timestamptz not null default now()
);

alter table public.ginni_access enable row level security;
-- (Intentionally no policies: the service-role key used by edge functions
--  bypasses RLS, while anon/auth clients get no access.)

-- Optional: clean up stale free-tier rows periodically.
-- delete from public.ginni_access
--   where premium_until is null and updated_at < now() - interval '60 days';
