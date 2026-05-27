-- =============================================================================
-- Migration: 20260528_review_system.sql
-- Purpose : Phase 1 of the review/community infrastructure.
--           Extends the existing `reviews` table, adds 5 new tables, 1 view,
--           and 7 PL/pgSQL functions covering submit → approve(+reward) →
--           reject / hide / unhide / feature / revoke_reward, plus a
--           compute_repurchase_rate helper.
--
-- Design decisions (confirmed with operator before authoring):
--   1. The pre-existing `reviews` table is kept and ALTERed in place.
--      The FK pattern stays `order_id uuid + user_provider/provider_account_id`
--      (matching the rest of the codebase). The spec's "order_no 1리뷰 1개"
--      requirement is already enforced by the existing `UNIQUE(order_id)`.
--   2. Reward crediting goes through a brand-new generic `user_credit_ledger`
--      (+/- rows, balance = SUM). `review_reward_ledger` becomes a typed
--      mirror that links each reward row to its underlying credit row.
--   3. Admin identity is the existing `admin_sessions.admin_email` (text).
--      No new admin_users uuid table is introduced.
--
-- Aimtalk: no notification code is written here. The spec explicitly
-- excludes both user and admin review-related aimtalk.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1) EXTEND existing `reviews` table
-- =============================================================================
-- Pre-existing columns (from 20260522_payment_system.sql):
--   id, order_id, user_provider, user_provider_account_id,
--   rating, body, display_name, masked_name,
--   status ('pending'|'approved'|'rejected'),
--   bonus_status ('none'|'pending'|'paid'),
--   created_at, reviewed_at;  UNIQUE(order_id).

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS title             text,
  ADD COLUMN IF NOT EXISTS plan_code         text,
  ADD COLUMN IF NOT EXISTS approved_at       timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by       text,   -- admin_email
  ADD COLUMN IF NOT EXISTS rejected_reason   text,
  ADD COLUMN IF NOT EXISTS rejected_at       timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_by       text,   -- admin_email
  ADD COLUMN IF NOT EXISTS hidden_at         timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by         text,   -- admin_email
  ADD COLUMN IF NOT EXISTS reward_granted    boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reward_amount_usd numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_granted_at timestamptz,
  ADD COLUMN IF NOT EXISTS helpful_count     integer      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured          boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_order    integer,
  ADD COLUMN IF NOT EXISTS updated_at        timestamptz  NOT NULL DEFAULT now();

-- Title length cap (50 chars, nullable).
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_title_check;
ALTER TABLE public.reviews
  ADD  CONSTRAINT reviews_title_check
       CHECK (title IS NULL OR char_length(title) <= 50);

-- Body length: relax DB bound to 10..1000 so existing rows (10..600 schema)
-- are preserved. The submit_review() function enforces the spec's 20..1000
-- on new submissions; this CHECK is the safety envelope.
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_body_check;
ALTER TABLE public.reviews
  ADD  CONSTRAINT reviews_body_check
       CHECK (char_length(body) BETWEEN 10 AND 1000);

-- Status: add 'hidden' to the existing enum.
ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_status_check;
ALTER TABLE public.reviews
  ADD  CONSTRAINT reviews_status_check
       CHECK (status IN ('pending', 'approved', 'rejected', 'hidden'));

-- updated_at trigger.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_touch_updated_at ON public.reviews;
CREATE TRIGGER reviews_touch_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();

-- Indexes (idempotent).
CREATE INDEX IF NOT EXISTS idx_reviews_status_created
  ON public.reviews (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_plan_status
  ON public.reviews (plan_code, status);
CREATE INDEX IF NOT EXISTS idx_reviews_provider
  ON public.reviews (user_provider, user_provider_account_id);
CREATE INDEX IF NOT EXISTS idx_reviews_featured
  ON public.reviews (featured_order NULLS LAST, created_at DESC)
  WHERE featured = true;


-- =============================================================================
-- 2) user_credit_ledger  (generic +/- credit ledger)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_credit_ledger (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_provider             text NOT NULL,
  user_provider_account_id  text NOT NULL,
  amount_usd                numeric(10,2) NOT NULL,  -- positive=credit, negative=debit
  amount_krw                integer       NOT NULL DEFAULT 0,
  source                    text NOT NULL,           -- 'review_reward' | 'review_reward_revoke' | future sources
  source_ref_type           text,                    -- 'review' | 'order' | 'manual' | ...
  source_ref_id             text,                    -- flexible id (uuid as text)
  note                      text,
  created_by                text,                    -- admin_email when admin-initiated
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user
  ON public.user_credit_ledger (user_provider, user_provider_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_source
  ON public.user_credit_ledger (source, source_ref_id);

COMMENT ON TABLE  public.user_credit_ledger IS
  'Universal user credit ledger. balance_usd = SUM(amount_usd). Append-only by convention.';
COMMENT ON COLUMN public.user_credit_ledger.amount_usd IS
  'Signed: positive = credit, negative = debit/revoke.';

-- Convenience view: per-user net balance.
CREATE OR REPLACE VIEW public.user_credit_balances AS
SELECT
  user_provider,
  user_provider_account_id,
  COALESCE(SUM(amount_usd), 0)::numeric(12,2) AS balance_usd,
  COALESCE(SUM(amount_krw), 0)::integer      AS balance_krw,
  MAX(created_at)                            AS last_credit_at
FROM public.user_credit_ledger
GROUP BY user_provider, user_provider_account_id;


-- =============================================================================
-- 3) review_reward_ledger  (one row per reward grant; UNIQUE per review)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.review_reward_ledger (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id                 uuid NOT NULL UNIQUE
                              REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_provider             text NOT NULL,
  user_provider_account_id  text NOT NULL,
  amount_usd                numeric(10,2) NOT NULL,
  amount_krw                integer       NOT NULL DEFAULT 0,
  credit_ledger_id          uuid REFERENCES public.user_credit_ledger(id),
  created_by                text NOT NULL,           -- admin_email
  created_at                timestamptz NOT NULL DEFAULT now(),
  revoked_at                timestamptz,
  revoked_by                text,
  revoked_reason            text,
  revoke_credit_ledger_id   uuid REFERENCES public.user_credit_ledger(id)
);

CREATE INDEX IF NOT EXISTS idx_review_reward_ledger_user
  ON public.review_reward_ledger (user_provider, user_provider_account_id);
CREATE INDEX IF NOT EXISTS idx_review_reward_ledger_created
  ON public.review_reward_ledger (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_reward_ledger_active
  ON public.review_reward_ledger (revoked_at) WHERE revoked_at IS NULL;


-- =============================================================================
-- 4) review_helpful  ("도움돼요")
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.review_helpful (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id                  uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  voter_provider             text NOT NULL,
  voter_provider_account_id  text NOT NULL,
  created_at                 timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, voter_provider, voter_provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpful_review
  ON public.review_helpful (review_id);

-- Keep reviews.helpful_count in sync.
CREATE OR REPLACE FUNCTION public.sync_review_helpful_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews
       SET helpful_count = helpful_count + 1
     WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews
       SET helpful_count = GREATEST(helpful_count - 1, 0)
     WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS review_helpful_sync_count ON public.review_helpful;
CREATE TRIGGER review_helpful_sync_count
  AFTER INSERT OR DELETE ON public.review_helpful
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_review_helpful_count();


-- =============================================================================
-- 5) case_studies  (curated long-form sales-page case studies)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.case_studies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  review_id       uuid REFERENCES public.reviews(id) ON DELETE SET NULL,
  title           text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  summary         text NOT NULL CHECK (char_length(summary) BETWEEN 1 AND 200),
  body_md         text NOT NULL,
  hero_image_url  text,
  customer_label  text,
  plan_code       text,
  metrics         jsonb NOT NULL DEFAULT '{}'::jsonb,
  published       boolean NOT NULL DEFAULT false,
  published_at    timestamptz,
  created_by      text NOT NULL,    -- admin_email
  updated_by      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_case_studies_published
  ON public.case_studies (published, published_at DESC) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_case_studies_review_id
  ON public.case_studies (review_id);

DROP TRIGGER IF EXISTS case_studies_touch_updated_at ON public.case_studies;
CREATE TRIGGER case_studies_touch_updated_at
  BEFORE UPDATE ON public.case_studies
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();


-- =============================================================================
-- 6) review_action_logs  (audit trail for every review-side action)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.review_action_logs (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_admin_email               text,   -- admin actor
  actor_user_provider             text,   -- user-initiated (REVIEW_SUBMIT, HELPFUL)
  actor_user_provider_account_id  text,
  action                          text NOT NULL CHECK (action IN (
    'REVIEW_SUBMIT', 'REVIEW_RESUBMIT',
    'REVIEW_APPROVE', 'REVIEW_REJECT',
    'REVIEW_HIDE', 'REVIEW_UNHIDE',
    'REVIEW_FEATURE', 'REVIEW_UNFEATURE',
    'REVIEW_HELPFUL_ADD', 'REVIEW_HELPFUL_REMOVE',
    'REWARD_GRANT', 'REWARD_REVOKE',
    'CASE_STUDY_CREATE', 'CASE_STUDY_UPDATE',
    'CASE_STUDY_PUBLISH', 'CASE_STUDY_UNPUBLISH'
  )),
  target_review_id      uuid REFERENCES public.reviews(id)      ON DELETE SET NULL,
  target_case_study_id  uuid REFERENCES public.case_studies(id) ON DELETE SET NULL,
  before_state          jsonb,
  after_state           jsonb,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_action_logs_review
  ON public.review_action_logs (target_review_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_action_logs_action_created
  ON public.review_action_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_action_logs_actor_admin
  ON public.review_action_logs (actor_admin_email, created_at DESC);


-- =============================================================================
-- 7) review_stats_view  (landing page + STATS section + admin dashboards)
-- =============================================================================
-- `orders` does not have a dedicated 'issued' status; instead the operative
-- "paid customer" set is status='paid' (terminal-paid). We also include
-- 'paid_pending_key' because the user has paid and is still our customer.
-- Adjust the filter here if business definition of "buyer" changes.
CREATE OR REPLACE VIEW public.review_stats_view AS
WITH approved AS (
  SELECT id, rating, created_at
    FROM public.reviews
   WHERE status = 'approved'
),
paid_orders AS (
  SELECT user_provider, user_provider_account_id
    FROM public.orders
   WHERE status IN ('paid', 'paid_pending_key')
     AND user_provider IS NOT NULL
     AND user_provider_account_id IS NOT NULL
),
buyer_counts AS (
  SELECT user_provider, user_provider_account_id, COUNT(*) AS order_cnt
    FROM paid_orders
   GROUP BY user_provider, user_provider_account_id
),
rating_buckets AS (
  SELECT r AS rating,
         (SELECT COUNT(*) FROM approved WHERE approved.rating = r) AS c
    FROM generate_series(1, 5) AS r
)
SELECT
  (SELECT COUNT(*)               FROM approved)                        AS total_reviews_approved,
  (SELECT ROUND(AVG(rating)::numeric, 1) FROM approved)                AS avg_rating,
  (SELECT jsonb_object_agg(rating::text, c) FROM rating_buckets)       AS rating_distribution,
  (SELECT COUNT(*)               FROM buyer_counts)                    AS total_unique_buyers,
  CASE
    WHEN (SELECT COUNT(*) FROM buyer_counts) > 0 THEN
      ROUND(
        ((SELECT COUNT(*) FROM buyer_counts WHERE order_cnt >= 2)::numeric
         / (SELECT COUNT(*) FROM buyer_counts)::numeric) * 100,
      1)
    ELSE 0
  END                                                                  AS repurchase_rate,
  (SELECT COUNT(*) FROM paid_orders)                                   AS total_orders_paid,
  (SELECT COUNT(*) FROM approved WHERE created_at >= now() - interval '30 days')
                                                                       AS recent_30d_reviews_count;


-- =============================================================================
-- 8) Functions
-- =============================================================================

-- 8.1 submit_review
-- Called by /api/reviews POST. Atomic eligibility check + insert.
-- The "key issued" check is performed in the app layer (lib/reviews/eligibility.ts)
-- so this function stays decoupled from the api_key_inventory / issued_api_keys
-- table-name divergence between earlier migrations.
CREATE OR REPLACE FUNCTION public.submit_review(
  p_order_id                   uuid,
  p_user_provider              text,
  p_user_provider_account_id   text,
  p_rating                     integer,
  p_title                      text,
  p_body                       text,
  p_display_name               text,
  p_masked_name                text,
  p_eligibility_after_days     integer DEFAULT 3
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order      RECORD;
  v_review_id  uuid;
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'RATING_INVALID' USING ERRCODE = 'P0001';
  END IF;
  IF char_length(coalesce(p_body, '')) < 20
     OR char_length(coalesce(p_body, '')) > 1000 THEN
    RAISE EXCEPTION 'BODY_LENGTH_INVALID' USING ERRCODE = 'P0001';
  END IF;
  IF p_title IS NOT NULL AND char_length(p_title) > 50 THEN
    RAISE EXCEPTION 'TITLE_TOO_LONG' USING ERRCODE = 'P0001';
  END IF;

  SELECT id, status, paid_at, created_at, product_code,
         user_provider, user_provider_account_id
    INTO v_order
    FROM public.orders
   WHERE id = p_order_id
     AND user_provider = p_user_provider
     AND user_provider_account_id = p_user_provider_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF v_order.status NOT IN ('paid', 'paid_pending_key') THEN
    RAISE EXCEPTION 'ORDER_NOT_PAID' USING ERRCODE = 'P0001';
  END IF;
  IF coalesce(v_order.paid_at, v_order.created_at) >
       now() - (p_eligibility_after_days || ' days')::interval THEN
    RAISE EXCEPTION 'COOLDOWN_NOT_PASSED' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS (SELECT 1 FROM public.reviews WHERE order_id = p_order_id) THEN
    RAISE EXCEPTION 'REVIEW_ALREADY_EXISTS' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.reviews (
    order_id, user_provider, user_provider_account_id,
    rating, title, body, display_name, masked_name,
    plan_code, status, bonus_status
  ) VALUES (
    p_order_id, p_user_provider, p_user_provider_account_id,
    p_rating, NULLIF(p_title, ''), p_body, p_display_name, p_masked_name,
    v_order.product_code, 'pending', 'pending'
  )
  RETURNING id INTO v_review_id;

  INSERT INTO public.review_action_logs (
    actor_user_provider, actor_user_provider_account_id,
    action, target_review_id, after_state
  ) VALUES (
    p_user_provider, p_user_provider_account_id,
    'REVIEW_SUBMIT', v_review_id,
    jsonb_build_object(
      'order_id',  p_order_id,
      'rating',    p_rating,
      'plan_code', v_order.product_code
    )
  );

  RETURN v_review_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_review FROM PUBLIC;

-- 8.2 approve_review_and_grant_reward
-- Single transaction:
--   reviews.status -> 'approved'
--   user_credit_ledger += reward
--   review_reward_ledger (UNIQUE on review_id) records the grant
--   review_action_logs: REVIEW_APPROVE + REWARD_GRANT (2 rows)
CREATE OR REPLACE FUNCTION public.approve_review_and_grant_reward(
  p_review_id    uuid,
  p_admin_email  text,
  p_reward_usd   numeric DEFAULT 50,
  p_reward_krw   integer DEFAULT 70000
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review     RECORD;
  v_credit_id  uuid;
  v_ledger_id  uuid;
  v_before     jsonb;
BEGIN
  IF p_admin_email IS NULL OR char_length(p_admin_email) = 0 THEN
    RAISE EXCEPTION 'ADMIN_EMAIL_REQUIRED' USING ERRCODE = 'P0001';
  END IF;
  IF p_reward_usd IS NULL OR p_reward_usd <= 0 THEN
    RAISE EXCEPTION 'REWARD_AMOUNT_INVALID' USING ERRCODE = 'P0001';
  END IF;

  -- Lock the row for the duration of the transaction.
  SELECT * INTO v_review
    FROM public.reviews
   WHERE id = p_review_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REVIEW_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF v_review.status <> 'pending' THEN
    RAISE EXCEPTION 'REVIEW_NOT_PENDING' USING ERRCODE = 'P0001';
  END IF;

  -- Defense in depth: ledger UNIQUE on review_id is the hard guarantee,
  -- but check first so the error is friendlier than a constraint violation.
  IF EXISTS (
    SELECT 1
      FROM public.review_reward_ledger
     WHERE review_id = p_review_id
       AND revoked_at IS NULL
  ) THEN
    RAISE EXCEPTION 'REWARD_ALREADY_GRANTED' USING ERRCODE = 'P0001';
  END IF;

  v_before := to_jsonb(v_review);

  UPDATE public.reviews
     SET status            = 'approved',
         approved_at       = now(),
         approved_by       = p_admin_email,
         reward_granted    = true,
         reward_amount_usd = p_reward_usd,
         reward_granted_at = now(),
         bonus_status      = 'paid',
         reviewed_at       = now()
   WHERE id = p_review_id;

  INSERT INTO public.user_credit_ledger (
    user_provider, user_provider_account_id,
    amount_usd, amount_krw,
    source, source_ref_type, source_ref_id,
    note, created_by
  ) VALUES (
    v_review.user_provider, v_review.user_provider_account_id,
    p_reward_usd, p_reward_krw,
    'review_reward', 'review', p_review_id::text,
    '리뷰 승인 보상', p_admin_email
  )
  RETURNING id INTO v_credit_id;

  INSERT INTO public.review_reward_ledger (
    review_id,
    user_provider, user_provider_account_id,
    amount_usd, amount_krw,
    credit_ledger_id, created_by
  ) VALUES (
    p_review_id,
    v_review.user_provider, v_review.user_provider_account_id,
    p_reward_usd, p_reward_krw,
    v_credit_id, p_admin_email
  )
  RETURNING id INTO v_ledger_id;

  INSERT INTO public.review_action_logs (
    actor_admin_email, action, target_review_id, before_state, after_state
  ) VALUES (
    p_admin_email, 'REVIEW_APPROVE', p_review_id, v_before,
    jsonb_build_object(
      'status',      'approved',
      'approved_at', now(),
      'approved_by', p_admin_email
    )
  );
  INSERT INTO public.review_action_logs (
    actor_admin_email, action, target_review_id, after_state
  ) VALUES (
    p_admin_email, 'REWARD_GRANT', p_review_id,
    jsonb_build_object(
      'amount_usd',        p_reward_usd,
      'amount_krw',        p_reward_krw,
      'credit_ledger_id',  v_credit_id,
      'reward_ledger_id',  v_ledger_id
    )
  );

  RETURN jsonb_build_object(
    'review_id',         p_review_id,
    'reward_ledger_id',  v_ledger_id,
    'credit_ledger_id',  v_credit_id,
    'amount_usd',        p_reward_usd,
    'amount_krw',        p_reward_krw,
    'approved_at',       now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.approve_review_and_grant_reward FROM PUBLIC;

-- 8.3 reject_review
CREATE OR REPLACE FUNCTION public.reject_review(
  p_review_id    uuid,
  p_admin_email  text,
  p_reason       text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review  RECORD;
  v_before  jsonb;
BEGIN
  IF p_reason IS NULL OR char_length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'REASON_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_review
    FROM public.reviews
   WHERE id = p_review_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REVIEW_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF v_review.status NOT IN ('pending') THEN
    -- approved reviews carry a reward; reject path is for pending only.
    -- Use revoke_reward + hide for already-approved cases.
    RAISE EXCEPTION 'REVIEW_NOT_REJECTABLE' USING ERRCODE = 'P0001';
  END IF;

  v_before := to_jsonb(v_review);

  UPDATE public.reviews
     SET status          = 'rejected',
         rejected_reason = p_reason,
         rejected_at     = now(),
         rejected_by     = p_admin_email,
         bonus_status    = 'none',
         reviewed_at     = now()
   WHERE id = p_review_id;

  INSERT INTO public.review_action_logs (
    actor_admin_email, action, target_review_id, before_state, after_state
  ) VALUES (
    p_admin_email, 'REVIEW_REJECT', p_review_id, v_before,
    jsonb_build_object('status', 'rejected', 'rejected_reason', p_reason)
  );

  RETURN jsonb_build_object('review_id', p_review_id, 'status', 'rejected');
END;
$$;

REVOKE ALL ON FUNCTION public.reject_review FROM PUBLIC;

-- 8.4 hide_review / unhide_review
CREATE OR REPLACE FUNCTION public.hide_review(
  p_review_id    uuid,
  p_admin_email  text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review  RECORD;
  v_before  jsonb;
BEGIN
  SELECT * INTO v_review
    FROM public.reviews
   WHERE id = p_review_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REVIEW_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF v_review.status = 'hidden' THEN
    RAISE EXCEPTION 'REVIEW_ALREADY_HIDDEN' USING ERRCODE = 'P0001';
  END IF;

  v_before := to_jsonb(v_review);

  UPDATE public.reviews
     SET status    = 'hidden',
         hidden_at = now(),
         hidden_by = p_admin_email,
         featured  = false,
         featured_order = NULL
   WHERE id = p_review_id;

  INSERT INTO public.review_action_logs (
    actor_admin_email, action, target_review_id, before_state, after_state
  ) VALUES (
    p_admin_email, 'REVIEW_HIDE', p_review_id, v_before,
    jsonb_build_object('status', 'hidden')
  );

  RETURN jsonb_build_object('review_id', p_review_id, 'status', 'hidden');
END;
$$;

REVOKE ALL ON FUNCTION public.hide_review FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.unhide_review(
  p_review_id    uuid,
  p_admin_email  text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review          RECORD;
  v_before          jsonb;
  v_restore_status  text;
BEGIN
  SELECT * INTO v_review
    FROM public.reviews
   WHERE id = p_review_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REVIEW_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF v_review.status <> 'hidden' THEN
    RAISE EXCEPTION 'REVIEW_NOT_HIDDEN' USING ERRCODE = 'P0001';
  END IF;

  -- Restore to approved if a reward was ever granted (regardless of revoke),
  -- otherwise return to pending so the admin can re-review.
  v_restore_status := CASE
    WHEN v_review.approved_at IS NOT NULL THEN 'approved'
    ELSE 'pending'
  END;

  v_before := to_jsonb(v_review);

  UPDATE public.reviews
     SET status    = v_restore_status,
         hidden_at = NULL,
         hidden_by = NULL
   WHERE id = p_review_id;

  INSERT INTO public.review_action_logs (
    actor_admin_email, action, target_review_id, before_state, after_state
  ) VALUES (
    p_admin_email, 'REVIEW_UNHIDE', p_review_id, v_before,
    jsonb_build_object('status', v_restore_status)
  );

  RETURN jsonb_build_object('review_id', p_review_id, 'status', v_restore_status);
END;
$$;

REVOKE ALL ON FUNCTION public.unhide_review FROM PUBLIC;

-- 8.5 feature_review (toggle + ordering)
CREATE OR REPLACE FUNCTION public.feature_review(
  p_review_id    uuid,
  p_admin_email  text,
  p_featured     boolean,
  p_order        integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review  RECORD;
  v_before  jsonb;
BEGIN
  SELECT * INTO v_review
    FROM public.reviews
   WHERE id = p_review_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REVIEW_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF p_featured AND v_review.status <> 'approved' THEN
    RAISE EXCEPTION 'ONLY_APPROVED_CAN_BE_FEATURED' USING ERRCODE = 'P0001';
  END IF;

  v_before := to_jsonb(v_review);

  UPDATE public.reviews
     SET featured       = p_featured,
         featured_order = CASE
           WHEN p_featured THEN COALESCE(p_order, featured_order)
           ELSE NULL
         END
   WHERE id = p_review_id;

  INSERT INTO public.review_action_logs (
    actor_admin_email, action, target_review_id, before_state, after_state
  ) VALUES (
    p_admin_email,
    CASE WHEN p_featured THEN 'REVIEW_FEATURE' ELSE 'REVIEW_UNFEATURE' END,
    p_review_id, v_before,
    jsonb_build_object('featured', p_featured, 'featured_order', p_order)
  );

  RETURN jsonb_build_object(
    'review_id',      p_review_id,
    'featured',       p_featured,
    'featured_order', p_order
  );
END;
$$;

REVOKE ALL ON FUNCTION public.feature_review FROM PUBLIC;

-- 8.6 revoke_reward (reverses 8.2)
-- Inserts a NEGATIVE row into user_credit_ledger, marks the ledger entry
-- revoked, optionally hides the review. Idempotent on already-revoked rows.
CREATE OR REPLACE FUNCTION public.revoke_reward(
  p_review_id    uuid,
  p_admin_email  text,
  p_reason       text,
  p_hide_review  boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward            RECORD;
  v_review            RECORD;
  v_revoke_credit_id  uuid;
  v_new_status        text;
BEGIN
  IF p_reason IS NULL OR char_length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'REASON_REQUIRED' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_reward
    FROM public.review_reward_ledger
   WHERE review_id = p_review_id
     AND revoked_at IS NULL
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REWARD_NOT_FOUND_OR_ALREADY_REVOKED' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_review
    FROM public.reviews
   WHERE id = p_review_id
   FOR UPDATE;

  INSERT INTO public.user_credit_ledger (
    user_provider, user_provider_account_id,
    amount_usd, amount_krw,
    source, source_ref_type, source_ref_id,
    note, created_by
  ) VALUES (
    v_reward.user_provider, v_reward.user_provider_account_id,
    -v_reward.amount_usd, -v_reward.amount_krw,
    'review_reward_revoke', 'review', p_review_id::text,
    p_reason, p_admin_email
  )
  RETURNING id INTO v_revoke_credit_id;

  UPDATE public.review_reward_ledger
     SET revoked_at              = now(),
         revoked_by              = p_admin_email,
         revoked_reason          = p_reason,
         revoke_credit_ledger_id = v_revoke_credit_id
   WHERE id = v_reward.id;

  v_new_status := CASE
    WHEN p_hide_review THEN 'hidden'
    ELSE v_review.status
  END;

  UPDATE public.reviews
     SET reward_granted = false,
         status         = v_new_status,
         hidden_at      = CASE WHEN p_hide_review THEN now() ELSE hidden_at END,
         hidden_by      = CASE WHEN p_hide_review THEN p_admin_email ELSE hidden_by END,
         featured       = CASE WHEN p_hide_review THEN false ELSE featured END,
         featured_order = CASE WHEN p_hide_review THEN NULL  ELSE featured_order END,
         bonus_status   = 'none'
   WHERE id = p_review_id;

  INSERT INTO public.review_action_logs (
    actor_admin_email, action, target_review_id, before_state, after_state
  ) VALUES (
    p_admin_email, 'REWARD_REVOKE', p_review_id,
    jsonb_build_object(
      'reward_amount_usd', v_reward.amount_usd,
      'reward_amount_krw', v_reward.amount_krw,
      'reason',            p_reason
    ),
    jsonb_build_object(
      'revoke_credit_ledger_id', v_revoke_credit_id,
      'review_status',           v_new_status
    )
  );

  RETURN jsonb_build_object(
    'review_id',               p_review_id,
    'revoke_credit_ledger_id', v_revoke_credit_id,
    'amount_usd',              -v_reward.amount_usd,
    'amount_krw',              -v_reward.amount_krw,
    'review_status',           v_new_status
  );
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_reward FROM PUBLIC;

-- 8.7 compute_repurchase_rate (handy STABLE helper; the view computes
-- the same value but this is convenient for API code paths that only
-- need the single number).
CREATE OR REPLACE FUNCTION public.compute_repurchase_rate()
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    ROUND(
      (
        COUNT(*) FILTER (WHERE order_cnt >= 2)::numeric
        / NULLIF(COUNT(*)::numeric, 0)
      ) * 100,
      1
    ),
    0
  )
  FROM (
    SELECT COUNT(*) AS order_cnt
      FROM public.orders
     WHERE status IN ('paid', 'paid_pending_key')
       AND user_provider IS NOT NULL
       AND user_provider_account_id IS NOT NULL
     GROUP BY user_provider, user_provider_account_id
  ) t;
$$;


-- =============================================================================
-- 9) RLS — service-role only access (Next.js API routes use service role).
-- =============================================================================
ALTER TABLE public.user_credit_ledger   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reward_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_action_logs   ENABLE ROW LEVEL SECURITY;
-- No policies = service role bypasses, anon/auth cannot read. The
-- existing `reviews` table RLS posture is unchanged by this migration.

COMMIT;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
