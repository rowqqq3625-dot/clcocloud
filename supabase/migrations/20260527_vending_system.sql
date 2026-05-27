-- =====================================================================
-- CLCOCLOUD Vending System (자판기 모듈)
-- =====================================================================
-- 본 마이그레이션은 idempotent — 재실행해도 동일 상태를 보장한다.
--
-- 변경 요약
--   1) plans 마스터 테이블 신규 (STANDARD / PRO / ULTRA 시드)
--   2) api_key_inventory 컬럼 ALTER 확장 (DROP 없음, 운영 데이터 보존)
--      + plan_id, key_fingerprint, key_preview, memo, created_by,
--        updated_at, revoked_at, revoked_reason
--      + partial UNIQUE 인덱스, status CHECK 갱신
--   3) vending_action_logs 신규 (append-only)
--   4) plan_stock_view 뷰
--   5) 함수 5종 (SECURITY DEFINER, search_path 고정)
--        issue_key_for_order  — 메인 발급 함수 (RAISE OUT_OF_STOCK)
--        reserve_key_for_order
--        release_reserved_keys
--        revoke_key
--        log_vending_action
--   6) 기존 issue_api_key(p_order_no) 는 백워드 호환 alias 로 재정의
-- =====================================================================

-- 0) 필요 확장
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- digest(key_value, 'sha256')

-- ---------------------------------------------------------------------
-- 1) plans 마스터
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text UNIQUE NOT NULL,
  name_ko     text NOT NULL,
  price_krw   integer NOT NULL CHECK (price_krw >= 0),
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 가격은 app/api/payapp/create/route.ts 의 매핑과 일치시킨다.
INSERT INTO public.plans (code, name_ko, price_krw) VALUES
  ('STANDARD', 'STANDARD 잔액형 키',  98000),
  ('PRO',      'PRO 잔액형 키',      196000),
  ('ULTRA',    'ULTRA 잔액형 키',    264000)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 2) api_key_inventory 확장 (ALTER 만, DROP 없음)
-- ---------------------------------------------------------------------
ALTER TABLE public.api_key_inventory
  ADD COLUMN IF NOT EXISTS plan_id         uuid REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS key_fingerprint text,
  ADD COLUMN IF NOT EXISTS key_preview     text,
  ADD COLUMN IF NOT EXISTS memo            text,
  ADD COLUMN IF NOT EXISTS created_by      uuid,
  ADD COLUMN IF NOT EXISTS updated_at      timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS revoked_at      timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_reason  text;

-- 백필: 기존 행의 plan_id / fingerprint / preview 가 비어 있으면 채운다.
UPDATE public.api_key_inventory i
   SET plan_id = p.id
  FROM public.plans p
 WHERE i.plan_id IS NULL
   AND i.product_code = p.code;

UPDATE public.api_key_inventory
   SET key_fingerprint = encode(digest(key_value, 'sha256'), 'hex')
 WHERE key_fingerprint IS NULL
   AND key_value IS NOT NULL;

UPDATE public.api_key_inventory
   SET key_preview = substring(key_value, 1, 8) || '...' || right(key_value, 4)
 WHERE key_preview IS NULL
   AND key_value IS NOT NULL
   AND length(key_value) > 12;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_aki_plan_status
  ON public.api_key_inventory (plan_id, status);
CREATE INDEX IF NOT EXISTS idx_aki_status_created
  ON public.api_key_inventory (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aki_reserved_order
  ON public.api_key_inventory (reserved_order_id);
CREATE INDEX IF NOT EXISTS idx_aki_issued_order_no
  ON public.api_key_inventory (issued_order_no);

-- UNIQUE 제약은 partial 로 — NULL 다수 허용 (백필 미완료 행 안전)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_aki_fingerprint
  ON public.api_key_inventory (key_fingerprint)
  WHERE key_fingerprint IS NOT NULL;

-- 1주문 1키 강제: issued 상태에서만 UNIQUE. revoked 후 reissue 가능.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_aki_issued_order_no_active
  ON public.api_key_inventory (issued_order_no)
  WHERE issued_order_no IS NOT NULL AND status = 'issued';

-- status CHECK 갱신 — 'expired' 추가.
-- 기존 행이 모두 5가지 값 안에 있으므로 VALIDATE 즉시 통과.
ALTER TABLE public.api_key_inventory
  DROP CONSTRAINT IF EXISTS api_key_inventory_status_check;
ALTER TABLE public.api_key_inventory
  ADD  CONSTRAINT api_key_inventory_status_check
       CHECK (status IN ('available','reserved','issued','revoked','expired'))
       NOT VALID;
ALTER TABLE public.api_key_inventory
  VALIDATE CONSTRAINT api_key_inventory_status_check;

-- updated_at 트리거 (admin_touch_updated_at 재사용)
DROP TRIGGER IF EXISTS aki_touch_updated_at ON public.api_key_inventory;
CREATE TRIGGER aki_touch_updated_at
  BEFORE UPDATE ON public.api_key_inventory
  FOR EACH ROW EXECUTE FUNCTION public.admin_touch_updated_at();

DROP TRIGGER IF EXISTS plans_touch_updated_at ON public.plans;
CREATE TRIGGER plans_touch_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.admin_touch_updated_at();

-- ---------------------------------------------------------------------
-- 3) vending_action_logs (append-only)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vending_action_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_admin_id  uuid,
  action          text NOT NULL CHECK (action IN (
    'KEY_REGISTER','KEY_BULK_REGISTER','KEY_UPDATE','KEY_REVOKE',
    'KEY_RESERVE','KEY_ISSUE','KEY_RELEASE','KEY_REISSUE',
    'MANUAL_ISSUE','PLAN_UPSERT','KEY_REVEAL'
  )),
  target_key_id   uuid REFERENCES public.api_key_inventory(id) ON DELETE SET NULL,
  target_order_no text,
  plan_code       text,
  before_state    jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_state     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_val_created
  ON public.vending_action_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_val_action
  ON public.vending_action_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_val_key
  ON public.vending_action_logs (target_key_id);
CREATE INDEX IF NOT EXISTS idx_val_order
  ON public.vending_action_logs (target_order_no);

DROP TRIGGER IF EXISTS vending_action_logs_no_modify ON public.vending_action_logs;
CREATE TRIGGER vending_action_logs_no_modify
  BEFORE UPDATE OR DELETE ON public.vending_action_logs
  FOR EACH ROW EXECUTE FUNCTION public.admin_log_block_modify();

-- ---------------------------------------------------------------------
-- 4) plan_stock_view
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW public.plan_stock_view AS
SELECT p.code                                              AS plan_code,
       COUNT(*) FILTER (WHERE i.status = 'available')      AS available_count,
       COUNT(*) FILTER (WHERE i.status = 'reserved')       AS reserved_count,
       COUNT(*) FILTER (WHERE i.status = 'issued')         AS issued_count,
       COUNT(*) FILTER (WHERE i.status = 'revoked')        AS revoked_count,
       COUNT(*) FILTER (WHERE i.status = 'expired')        AS expired_count,
       COUNT(i.id)                                         AS total_count
  FROM public.plans p
  LEFT JOIN public.api_key_inventory i ON i.plan_id = p.id
 GROUP BY p.code;

-- ---------------------------------------------------------------------
-- 5) RLS — service_role 만 접근
-- ---------------------------------------------------------------------
ALTER TABLE public.plans               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vending_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_plans ON public.plans;
DROP POLICY IF EXISTS service_role_all_val   ON public.vending_action_logs;

CREATE POLICY service_role_all_plans
  ON public.plans FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY service_role_all_val
  ON public.vending_action_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- =====================================================================
-- 함수
-- =====================================================================

-- ---------------------------------------------------------------------
-- 6) log_vending_action — vending_action_logs 인서트 헬퍼
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_vending_action(
  p_actor      uuid,
  p_action     text,
  p_key_id     uuid,
  p_order_no   text,
  p_plan_code  text,
  p_before     jsonb,
  p_after      jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.vending_action_logs (
    actor_admin_id, action, target_key_id, target_order_no,
    plan_code, before_state, after_state
  ) VALUES (
    p_actor, p_action, p_key_id, p_order_no,
    p_plan_code,
    COALESCE(p_before, '{}'::jsonb),
    COALESCE(p_after,  '{}'::jsonb)
  );
END;
$$;

-- ---------------------------------------------------------------------
-- 7) issue_key_for_order — 메인 발급 함수
-- ---------------------------------------------------------------------
--   . orders.status 검증 (paid / paid_pending_key 만 허용)
--   . 멱등성: 동일 order_no 로 이미 issued 키가 있으면 그 키 반환
--   . FOR UPDATE SKIP LOCKED 로 동시 결제 안전
--   . 가용 키 없으면 RAISE EXCEPTION 'OUT_OF_STOCK'
--   . 플랜 불일치(STANDARD 주문에 PRO 키) 자동 차단 (plan_id 매칭)
CREATE OR REPLACE FUNCTION public.issue_key_for_order(p_order_no text)
RETURNS TABLE(api_key text, key_id uuid, plan_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order    public.orders%ROWTYPE;
  v_plan     public.plans%ROWTYPE;
  v_key      public.api_key_inventory%ROWTYPE;
  v_existing uuid;
BEGIN
  -- (a) 주문 조회 + 행 잠금
  SELECT * INTO v_order
    FROM public.orders
   WHERE order_no = p_order_no
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: %', p_order_no USING ERRCODE = 'P0002';
  END IF;

  -- (b) 멱등성: 이미 발급된 키가 있으면 그것을 그대로 반환
  SELECT id INTO v_existing
    FROM public.api_key_inventory
   WHERE issued_order_no = p_order_no AND status = 'issued'
   LIMIT 1;

  IF v_existing IS NOT NULL THEN
    SELECT * INTO v_key  FROM public.api_key_inventory WHERE id = v_existing;
    SELECT * INTO v_plan FROM public.plans              WHERE id = v_key.plan_id;
    api_key   := v_key.key_value;
    key_id    := v_key.id;
    plan_code := COALESCE(v_plan.code, v_key.product_code);
    RETURN NEXT;
    RETURN;
  END IF;

  -- (c) 결제 완료 검증
  --     수동 매칭 흐름(paid_pending_key)도 발급 허용
  IF v_order.status NOT IN ('paid', 'paid_pending_key') THEN
    RAISE EXCEPTION 'ORDER_NOT_PAID: status=% order_no=%',
                    v_order.status, p_order_no
          USING ERRCODE = 'P0001';
  END IF;

  -- (d) 플랜 매핑
  SELECT * INTO v_plan
    FROM public.plans
   WHERE code = v_order.product_code AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PLAN_NOT_FOUND: %', v_order.product_code
          USING ERRCODE = 'P0002';
  END IF;

  -- (e) pre-reserved 키 우선 (예약 → 확정 흐름)
  SELECT * INTO v_key
    FROM public.api_key_inventory
   WHERE reserved_order_id = v_order.id
     AND status = 'reserved'
     AND plan_id = v_plan.id   -- 플랜 일치 강제
   LIMIT 1
   FOR UPDATE;

  -- (f) pre-reserved 없으면 가용 키 1개 픽업 (SKIP LOCKED)
  IF NOT FOUND THEN
    SELECT * INTO v_key
      FROM public.api_key_inventory
     WHERE plan_id = v_plan.id
       AND status = 'available'
     ORDER BY created_at ASC
     LIMIT 1
     FOR UPDATE SKIP LOCKED;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'OUT_OF_STOCK: plan=%', v_plan.code
            USING ERRCODE = 'P0001';
    END IF;
  END IF;

  -- (g) 발급 처리
  UPDATE public.api_key_inventory
     SET status            = 'issued',
         issued_at         = now(),
         issued_order_no   = p_order_no,
         issued_order_id   = v_order.id,
         reserved_order_id = NULL,
         reserved_at       = NULL
   WHERE id = v_key.id;

  -- (h) 매핑 테이블 인서트 (멱등)
  INSERT INTO public.issued_api_keys (order_no, key_id, issued_at)
       VALUES (p_order_no, v_key.id, now())
  ON CONFLICT DO NOTHING;

  -- (i) 감사 로그 — key_value 평문은 저장하지 않는다 (해시·preview 만)
  PERFORM public.log_vending_action(
    NULL,
    'KEY_ISSUE',
    v_key.id,
    p_order_no,
    v_plan.code,
    jsonb_build_object(
      'status',          v_key.status,
      'key_fingerprint', v_key.key_fingerprint,
      'key_preview',     v_key.key_preview
    ),
    jsonb_build_object(
      'status',    'issued',
      'issued_at', now()
    )
  );

  -- (j) 결과 반환
  api_key   := v_key.key_value;
  key_id    := v_key.id;
  plan_code := v_plan.code;
  RETURN NEXT;
  RETURN;
END;
$$;

-- ---------------------------------------------------------------------
-- 8) issue_api_key — 백워드 호환 alias
-- ---------------------------------------------------------------------
-- 기존 결제 웹훅·다른 호출처가 이 이름으로 RPC 를 호출해도
-- 동일 로직(issue_key_for_order) 이 실행되도록 시그니처를 보존한다.
DROP FUNCTION IF EXISTS public.issue_api_key(text);
CREATE OR REPLACE FUNCTION public.issue_api_key(p_order_no text)
RETURNS TABLE(api_key text, key_id uuid, product_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM public.issue_key_for_order(p_order_no) LOOP
    api_key      := r.api_key;
    key_id       := r.key_id;
    product_name := COALESCE(
      (SELECT name_ko FROM public.plans WHERE code = r.plan_code),
      r.plan_code
    );
    RETURN NEXT;
  END LOOP;
  RETURN;
END;
$$;

-- ---------------------------------------------------------------------
-- 9) reserve_key_for_order — 선택적 2-phase 예약
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_key_for_order(p_order_no text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order  public.orders%ROWTYPE;
  v_plan   public.plans%ROWTYPE;
  v_key_id uuid;
BEGIN
  SELECT * INTO v_order
    FROM public.orders
   WHERE order_no = p_order_no
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: %', p_order_no USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_plan
    FROM public.plans
   WHERE code = v_order.product_code AND active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PLAN_NOT_FOUND: %', v_order.product_code
          USING ERRCODE = 'P0002';
  END IF;

  SELECT id INTO v_key_id
    FROM public.api_key_inventory
   WHERE plan_id = v_plan.id
     AND status = 'available'
   ORDER BY created_at ASC
   LIMIT 1
   FOR UPDATE SKIP LOCKED;

  IF v_key_id IS NULL THEN
    RAISE EXCEPTION 'OUT_OF_STOCK: plan=%', v_plan.code USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.api_key_inventory
     SET status            = 'reserved',
         reserved_at       = now(),
         reserved_order_id = v_order.id
   WHERE id = v_key_id;

  PERFORM public.log_vending_action(
    NULL,
    'KEY_RESERVE',
    v_key_id,
    p_order_no,
    v_plan.code,
    '{}'::jsonb,
    jsonb_build_object('status', 'reserved', 'reserved_at', now())
  );

  RETURN v_key_id;
END;
$$;

-- ---------------------------------------------------------------------
-- 10) release_reserved_keys — 예약 타임아웃 복구 (크론용)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_reserved_keys(
  p_older_than_minutes int DEFAULT 15
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count int;
BEGIN
  WITH released AS (
    UPDATE public.api_key_inventory
       SET status            = 'available',
           reserved_at       = NULL,
           reserved_order_id = NULL
     WHERE status = 'reserved'
       AND reserved_at < now() - make_interval(mins => p_older_than_minutes)
    RETURNING id
  )
  SELECT count(*) INTO v_count FROM released;

  IF v_count > 0 THEN
    PERFORM public.log_vending_action(
      NULL,
      'KEY_RELEASE',
      NULL,
      NULL,
      NULL,
      jsonb_build_object('count', v_count),
      jsonb_build_object('older_than_minutes', p_older_than_minutes)
    );
  END IF;

  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------
-- 11) revoke_key — 키 폐기
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revoke_key(
  p_key_id uuid,
  p_reason text,
  p_actor  uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_before    jsonb;
  v_plan_code text;
BEGIN
  SELECT jsonb_build_object(
           'status',          status,
           'plan_id',         plan_id,
           'key_fingerprint', key_fingerprint
         )
    INTO v_before
    FROM public.api_key_inventory
   WHERE id = p_key_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'KEY_NOT_FOUND: %', p_key_id USING ERRCODE = 'P0002';
  END IF;

  SELECT code INTO v_plan_code
    FROM public.plans
   WHERE id = (SELECT plan_id FROM public.api_key_inventory WHERE id = p_key_id);

  UPDATE public.api_key_inventory
     SET status         = 'revoked',
         revoked_at     = now(),
         revoked_reason = p_reason
   WHERE id = p_key_id;

  PERFORM public.log_vending_action(
    p_actor,
    'KEY_REVOKE',
    p_key_id,
    NULL,
    v_plan_code,
    v_before,
    jsonb_build_object(
      'status',     'revoked',
      'revoked_at', now(),
      'reason',     p_reason
    )
  );
END;
$$;
