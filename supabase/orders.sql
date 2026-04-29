create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_provider text not null,
  user_provider_account_id text not null,
  user_email text,
  contact_email text not null,
  plan_id text not null,
  plan_name text not null,
  balance_usd integer not null,
  price_krw integer not null,
  os_targets text[] not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'issued')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

-- The Next.js server uses SUPABASE_SERVICE_ROLE_KEY for inserts and admin reads.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to the browser.
