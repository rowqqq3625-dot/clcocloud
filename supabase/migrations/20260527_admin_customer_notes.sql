-- =====================================================================
-- admin_customer_notes
-- Operator-authored notes attached to a customer identified by their OAuth
-- (provider, provider_account_id) pair. Used by the Customer 360° page in
-- the admin panel for CRM context (preferences, issues raised over phone,
-- pricing exceptions discussed, etc.).
--
-- Authorship is tied to admin_email at write time. Notes are append-only
-- from the API surface — deletion uses a soft-delete flag (`deleted_at`)
-- to preserve audit history. Hard deletes are forbidden by RLS / GRANT.
-- =====================================================================

create table if not exists admin_customer_notes (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_account_id text not null,
  author_email text not null,
  body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null,
  deleted_by_email text null
);

create index if not exists admin_customer_notes_customer_idx
  on admin_customer_notes (provider, provider_account_id, created_at desc);

create index if not exists admin_customer_notes_author_idx
  on admin_customer_notes (author_email, created_at desc);

-- =====================================================================
-- RLS — service-role only. Operator access goes through server routes
-- that already enforce admin session + CSRF via lib/admin/guard.ts.
-- =====================================================================
alter table admin_customer_notes enable row level security;

drop policy if exists "admin_customer_notes_no_anon" on admin_customer_notes;
create policy "admin_customer_notes_no_anon" on admin_customer_notes
  for all
  to authenticated, anon
  using (false)
  with check (false);

-- =====================================================================
-- Forbid hard deletes from any role except postgres (the migration owner).
-- Service-role inserts and updates remain allowed; only delete is blocked.
-- =====================================================================
revoke delete on admin_customer_notes from public, anon, authenticated, service_role;
