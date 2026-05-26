-- =====================================================================
-- BOOTSTRAP: 클코클라우드 admin 시스템 — 단일 SQL
-- 한 번에 Supabase Dashboard → SQL Editor 에 붙여넣고 RUN 누르세요.
-- =====================================================================

-- =====================================================================
-- CLCOCLOUD Admin System
-- =====================================================================
-- Tables in this migration are accessed exclusively through the server
-- using the SUPABASE_SERVICE_ROLE_KEY. RLS is enabled with no policies
-- for anon/authenticated, effectively blocking direct client access.
-- =====================================================================

-- 1. Temporary auth challenge (after entry token, before session issuance)
CREATE TABLE IF NOT EXISTS public.admin_auth_challenges (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email         text NOT NULL,
  entry_token_hash    text NOT NULL UNIQUE,
  password_passed     boolean NOT NULL DEFAULT false,
  date_code_passed    boolean NOT NULL DEFAULT false,
  ip                  inet,
  country             text,
  user_agent_hash     text,
  expires_at          timestamptz NOT NULL,
  consumed_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_auth_challenges_email
  ON public.admin_auth_challenges (admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_auth_challenges_expires
  ON public.admin_auth_challenges (expires_at);

-- 2. Issued admin sessions (server-side store; cookie carries opaque token)
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email         text NOT NULL,
  session_token_hash  text NOT NULL UNIQUE,
  issued_at           timestamptz NOT NULL DEFAULT now(),
  expires_at          timestamptz NOT NULL,
  revoked_at          timestamptz,
  revoked_reason      text,
  ip                  inet,
  country             text,
  user_agent_hash     text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_active
  ON public.admin_sessions (revoked_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires
  ON public.admin_sessions (expires_at);

-- 3. Failure counters / lockouts (per IP+scope)
CREATE TABLE IF NOT EXISTS public.admin_rate_limits (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key                 text NOT NULL,
  scope               text NOT NULL,
  fail_count          integer NOT NULL DEFAULT 0,
  locked_until        timestamptz,
  last_fail_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, scope)
);

CREATE INDEX IF NOT EXISTS idx_admin_rate_limits_lookup
  ON public.admin_rate_limits (key, scope);

-- 4. Append-only audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email         text,
  action              text NOT NULL,
  target_type         text,
  target_id           text,
  payload             jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip                  inet,
  country             text,
  user_agent_hash     text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created
  ON public.admin_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action
  ON public.admin_audit_logs (action, created_at DESC);

-- 5. Append-only security event log (entry denials, session replaces, etc.)
CREATE TABLE IF NOT EXISTS public.admin_security_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type          text NOT NULL,
  email               text,
  ip                  inet,
  country             text,
  user_agent_hash     text,
  payload             jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_security_events_type
  ON public.admin_security_events (event_type, created_at DESC);

-- 6. Singleton-style settings (e.g. current active admin session id)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key                 text PRIMARY KEY,
  value               jsonb NOT NULL,
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Append-only triggers
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_log_block_modify()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'admin log tables are append-only (table=%, op=%)', TG_TABLE_NAME, TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS admin_audit_logs_no_modify ON public.admin_audit_logs;
CREATE TRIGGER admin_audit_logs_no_modify
  BEFORE UPDATE OR DELETE ON public.admin_audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.admin_log_block_modify();

DROP TRIGGER IF EXISTS admin_security_events_no_modify ON public.admin_security_events;
CREATE TRIGGER admin_security_events_no_modify
  BEFORE UPDATE OR DELETE ON public.admin_security_events
  FOR EACH ROW EXECUTE FUNCTION public.admin_log_block_modify();

-- updated_at maintainers (rate limit, settings)
CREATE OR REPLACE FUNCTION public.admin_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_rate_limits_touch ON public.admin_rate_limits;
CREATE TRIGGER admin_rate_limits_touch
  BEFORE UPDATE ON public.admin_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.admin_touch_updated_at();

DROP TRIGGER IF EXISTS admin_settings_touch ON public.admin_settings;
CREATE TRIGGER admin_settings_touch
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.admin_touch_updated_at();

-- ---------------------------------------------------------------------
-- RLS: service_role only. No policies for anon/authenticated.
-- ---------------------------------------------------------------------
ALTER TABLE public.admin_auth_challenges  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_rate_limits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_security_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_admin_auth_challenges  ON public.admin_auth_challenges;
DROP POLICY IF EXISTS service_role_all_admin_sessions         ON public.admin_sessions;
DROP POLICY IF EXISTS service_role_all_admin_rate_limits      ON public.admin_rate_limits;
DROP POLICY IF EXISTS service_role_all_admin_audit_logs       ON public.admin_audit_logs;
DROP POLICY IF EXISTS service_role_all_admin_security_events  ON public.admin_security_events;
DROP POLICY IF EXISTS service_role_all_admin_settings         ON public.admin_settings;

CREATE POLICY service_role_all_admin_auth_challenges
  ON public.admin_auth_challenges FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_admin_sessions
  ON public.admin_sessions FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_admin_rate_limits
  ON public.admin_rate_limits FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_admin_audit_logs
  ON public.admin_audit_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_admin_security_events
  ON public.admin_security_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_admin_settings
  ON public.admin_settings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- Helpers used by lib/admin/session.ts
-- ---------------------------------------------------------------------

-- Revoke all currently-active admin sessions in a single transactional step.
CREATE OR REPLACE FUNCTION public.admin_revoke_all_active_sessions(p_reason text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.admin_sessions
     SET revoked_at     = now(),
         revoked_reason = COALESCE(p_reason, 'REVOKED')
   WHERE revoked_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Set the singleton current_admin_session pointer.
CREATE OR REPLACE FUNCTION public.admin_set_current_session(p_session_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.admin_settings (key, value)
       VALUES ('current_admin_session', jsonb_build_object('session_id', p_session_id))
  ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           updated_at = now();
END;
$$;

-- Atomically revoke all + insert new + set pointer.
CREATE OR REPLACE FUNCTION public.admin_issue_session(
  p_admin_email         text,
  p_session_token_hash  text,
  p_expires_at          timestamptz,
  p_ip                  inet,
  p_country             text,
  p_user_agent_hash     text
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id uuid;
BEGIN
  PERFORM public.admin_revoke_all_active_sessions('REPLACED_BY_NEW_LOGIN');

  INSERT INTO public.admin_sessions (
    admin_email, session_token_hash, expires_at, ip, country, user_agent_hash
  ) VALUES (
    p_admin_email, p_session_token_hash, p_expires_at, p_ip, p_country, p_user_agent_hash
  )
  RETURNING id INTO v_session_id;

  PERFORM public.admin_set_current_session(v_session_id);
  RETURN v_session_id;
END;
$$;

-- ============================ 두번째 파일 =============================

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

-- ============== 마지막: PostgREST 스키마 캐시 새로고침 ==============
NOTIFY pgrst, 'reload schema';
