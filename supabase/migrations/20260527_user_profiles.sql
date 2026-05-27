-- =====================================================================
-- CLCOCLOUD User Profiles
-- =====================================================================
-- Tracks every OAuth-authenticated user the moment they sign in,
-- regardless of whether they ever place an order. Powers the admin
-- "all members" view with current-online / last-seen indicators.
--
-- Server-side only access via SUPABASE_SERVICE_ROLE_KEY; RLS enabled
-- with no policies for anon/authenticated.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider               text NOT NULL,
  provider_account_id    text NOT NULL,
  email                  text,
  name                   text,
  image                  text,
  signed_up_at           timestamptz NOT NULL DEFAULT now(),
  last_seen_at           timestamptz NOT NULL DEFAULT now(),
  last_seen_ip           inet,
  last_seen_user_agent   text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_last_seen
  ON public.user_profiles (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_lower
  ON public.user_profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_user_profiles_signed_up
  ON public.user_profiles (signed_up_at DESC);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- updated_at auto-refresh
CREATE OR REPLACE FUNCTION public.tg_user_profiles_touch_updated()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_touch_updated ON public.user_profiles;
CREATE TRIGGER user_profiles_touch_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_user_profiles_touch_updated();

-- Backfill from existing orders: any historical buyer becomes a profile
-- with their most recent order timestamp as a conservative last_seen_at.
INSERT INTO public.user_profiles (provider, provider_account_id, email, name, signed_up_at, last_seen_at)
SELECT
  o.user_provider,
  o.user_provider_account_id,
  COALESCE(o.user_email, o.contact_email),
  o.buyer_name,
  MIN(o.created_at),
  MAX(o.created_at)
FROM public.orders o
WHERE o.user_provider IS NOT NULL
  AND o.user_provider_account_id IS NOT NULL
GROUP BY o.user_provider, o.user_provider_account_id, COALESCE(o.user_email, o.contact_email), o.buyer_name
ON CONFLICT (provider, provider_account_id) DO NOTHING;
