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

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_provider text not null,
  user_provider_account_id text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 600),
  display_name text not null check (char_length(display_name) between 1 and 40),
  masked_name text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  bonus_status text not null default 'pending' check (bonus_status in ('none', 'pending', 'paid')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(order_id)
);

create table if not exists public.balance_requests (
  id uuid primary key default gen_random_uuid(),
  user_provider text not null,
  user_provider_account_id text not null,
  contact_email text not null,
  request_amount text not null,
  message text not null check (char_length(message) between 5 and 800),
  status text not null default 'pending' check (status in ('pending', 'answered', 'fulfilled', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.balance_requests enable row level security;

-- The Next.js server uses SUPABASE_SERVICE_ROLE_KEY for writes and admin reads.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to the browser.

create table if not exists public.dashboard_key_records (
  id uuid primary key default gen_random_uuid(),
  user_provider text not null,
  user_provider_account_id text not null,
  encrypted_api_key text not null,
  api_key_fingerprint text not null,
  masked_api_key text not null,
  last_status text,
  last_balance numeric,
  last_spend_cap numeric,
  last_rpm integer,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_provider, user_provider_account_id, api_key_fingerprint)
);

create table if not exists public.session_events (
  id uuid primary key default gen_random_uuid(),
  user_provider text not null,
  user_provider_account_id text not null,
  event_type text not null,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.dashboard_key_records enable row level security;
alter table public.session_events enable row level security;
